import { Hardware } from "./Hardware";
import { MMU } from "./MMU";
import { Console } from "./Console";
import { InterruptController } from "./InterruptController";
import { ClockListener } from "./imp/ClockListener";
import { system } from "../System";
import { Ascii } from "./Ascii";

export class Cpu extends Hardware implements ClockListener {

    private cpuClockCount: number;
    private MMU: MMU;
    private console: Console;
    private ICU: InterruptController;
    private ascii: Ascii;
    public statusDebug: boolean = false;
    public errorDebug: boolean = false;
    public pulseDebug: boolean = false;
    public interruptDebug: boolean = false;

    private xReg: number = 0x00;
    private yReg: number = 0x00;
    private accumulator: number = 0x00;
    private PC: number = 0x0000;
    private IR: number = 0x00;
    private zFlag: number = 0b0;
    private step: number = 0x0;
    private mode: number = 0x0;

    private tempStore: number = null;

    constructor(mmu: MMU, console: Console, ICU: InterruptController, ascii: Ascii) {
        super('CPU', 0);
        this.cpuClockCount = 0;
        this.MMU = mmu;
        this.console = console;
        this.ICU = ICU;
        this.ascii = ascii;
    }

    // every clock cycle, increment the clock count and log ithehe
    public pulse(): void {
        this.cpuClockCount++;

        if (this.pulseDebug) {
            this.log("Received clock pulse - CPU Clock Count: " + this.cpuClockCount);
        }
        if (this.statusDebug) {
            this.log(this.status());
        }

        this.pipeline();
    }

    /* 
    emulates the CPU pipeline
    cycle: fetch, decode1, decode2, execute1, execute2, write back, interrupt check
    not all instructions need all of these steps, decode/execute steps may be skipped
    */
    private pipeline(): void {
        switch (this.step) {
            case (0x0): {
                // FETCH
                this.fetch();
                break;
            } case (0x1): {
                // DECODE
                this.decode(1);
                break;
            } case (0x2): {
                // DECODE 
                this.decode(2);
                break;
            } case (0x3): {
                // EXECUTE
                this.execute(1);
                break;
            } case (0x4): {
                // EXECUTE
                this.execute(2);
                break;
            } case (0x5): {
                // WB
                this.writeBack();
                break;
            } case (0x6): {
                // INTERRUPT
                this.interruptCheck();
                break;
            } default: {
                if (this.errorDebug) {
                    this.log("INSTRUCTION CYCLE ERROR");
                }
                break;
            }
        }
    }

    // set the instruction register to the data in the address of the program counter 
    private fetch(): void {
        this.IR = this.MMU.readImmediate(this.PC);
        this.PC++;
        // increment step as all instructions need decode1 after fetch
        this.step++;
    }

    /* 
    decodes instruction from IR
    works in phases
    phase 1: set a constant or a LOB depending on instruction
    phase 2: set a HOB
    ALL instructions are listed in the switch regardless of if something must be done
    Blank cases result in a case type, for example setting hob and lob
    */
    private decode(phase: number): void {

        switch (this.IR) {

            // done in blocks, instructions need one of 3 scenarios
            // get a constant from memory and store it in temp val
            case (0xA9): {   // LDA constant to accum
            } case (0xA2): { // load x with constant
            } case (0xA0): { // load y from constant
            } case (0xD0): { // branch if z flag 0
                this.tempStore = this.MMU.readImmediate(this.PC);
                this.PC++;
                this.step = 0x3; // decode2 not needed
                break;
            }

            // Set LOB and HOB
            case (0xAD): {   // LDA from memory
            } case (0x8D): { // store accum to mem
            } case (0x6D): { // add with carry
            } case (0xAE): { // load x from mem
            } case (0xAC): { // load y from mem
            } case (0xEC): { // compare mem with x and set z if eq
            } case (0xEE): { // increment byte in mem
                // if first decode, we are setting LOB, second its HOB
                if (phase == 1) {
                    this.MMU.setLob(this.MMU.readImmediate(this.PC)); // decode1
                } else if (phase == 2) {
                    this.MMU.setHob(this.MMU.readImmediate(this.PC)); // decode2
                }
                this.PC++;
                this.step++;
                break;
            }

            // no decoding needed 
            case (0x8A): {   // load accum from x
            } case (0x98): { // load accum from y
            } case (0xAA): { // load x from accum
            } case (0xA8): { // load y from accum
            } case (0xEA): { // no OP
            } case (0x00): { // break
                // skip to execute without wasting a cycle on decode
                this.step = 3;
                this.execute(1);
                break;
            }

            // special case
            case (0xFF): {
                // system call
                if (this.xReg == 0x03) {
                    if (phase == 1) {
                        this.MMU.setLob(this.MMU.readImmediate(this.PC)); // decode1
                    } else if (phase == 2) {
                        this.MMU.setHob(this.MMU.readImmediate(this.PC)); // decode2
                    }
                    this.PC++;
                    this.step++;
                } else {
                    // skip to execute
                    this.step = 0x3;
                }
                break;
            }

            // default if no instruction match is made
            default: {
                if (this.errorDebug) {
                    this.log("ERROR: INVALID INSTRUCTION: " + super.hexLog(this.IR, 2));
                }
                this.step = 0x6;
                break;
            }
        }
    }

    // executes the instruction in the IR with the info we decoded
    private execute(phase: number): void {
        switch (this.IR) {
            case (0xA9): {   // LDA constant to accum
                this.accumulator = this.tempStore;
                this.step = 0x6; // no further execute or WB needed
                break;
            } case (0xAD): { // LDA accum from memory
                this.accumulator = this.MMU.readFromMem(); // use lob and hob
                this.step = 0x6;
                break;
            } case (0x8D): { // store accum to mem
                this.step = 0x5;
                break;
            } case (0x8A): { // load accum from X
                this.accumulator = this.xReg;
                this.step = 0x6;
                break;
            } case (0x98): { // load accum from y
                this.accumulator = this.yReg;
                this.step = 0x6;
                break;
            } case (0x6D): { // add with carry
                // TODO: carry flag? 
                // TODO: overflow? 
                if (phase == 1) {
                    this.tempStore = this.MMU.readFromMem();
                    this.step++;
                } else if (phase == 2) {
                    this.accumulator += this.tempStore;
                    // complementary number wrap
                    let comp: string = this.accumulator.toString(16);
                    if (comp.length >= 3) {
                        comp = comp.slice(1);
                        this.accumulator = parseInt(comp, 16);
                    }
                    this.step = 0x6;
                }
                break;
            } case (0xA2): { // load x with constant
                this.xReg = this.tempStore;
                this.step = 0x6;
                break;
            } case (0xAE): { // load x from mem
                this.xReg = this.MMU.readFromMem();
                this.step = 0x6;
                break;
            } case (0xAA): { // load x from accum
                this.xReg = this.accumulator;
                this.step = 0x6;
                break;
            } case (0xA0): { // load y from const
                this.yReg = this.tempStore;
                this.step = 0x6;
                break;
            } case (0xAC): { // load y from mem
                this.yReg = this.MMU.readFromMem();
                this.step = 0x6;
                break;
            } case (0xA8): { // load y from accum
                this.yReg = this.accumulator;
                this.step = 0x6;
                break;
            } case (0xEA): { // no op
                this.step = 0x6;
                break;
            } case (0x00): { // break
                // end program
                system.stopSystem();
                break;
            } case (0xEC): { // compare mem to x, set z if eq
                if (phase == 1) {
                    this.tempStore = this.MMU.readFromMem();
                    this.step++;
                } else if (phase == 2) {
                    if (this.tempStore == this.xReg) {
                        this.zFlag = 0b1;
                    } else {
                        this.zFlag = 0b0;
                    }
                    this.step = 0x6;
                }
                break;
            } case (0xD0): { // branch if z flag 0
                // check z flag and use complements
                if (this.zFlag == 0b0) {
                    // affix 0xFF00 to front of 8 bit branch value so we can use it with 16 bit PC
                    if (this.tempStore > 0x7F) {
                        this.PC += (0xFF00 + this.tempStore);
                        let comp: string = this.PC.toString(16);
                        if (comp.length >= 5) {
                            comp = comp.slice(1);
                            this.PC = parseInt(comp, 16);
                        }
                    } else {
                        this.PC += this.tempStore;
                    }
                }
                this.step = 0x6;
                break;
            } case (0xEE): { // increment byte in mem
                if (phase == 1) {
                    this.accumulator = this.MMU.readFromMem();
                } else if (phase == 2) {
                    this.accumulator++;
                }
                this.step++;
                break;
            } case (0xFF): { // system calls
                // Interface with console unit
                if (this.xReg == 0x01) { // output Y register contents
                    // creates an interrupt
                    this.console.acceptOutput(this.yReg);
                    this.step = 0x6;
                } else if (this.xReg == 0x02) { // string output from address in y
                    // assumes context (the HOB of the starting address) from the PC
                    // keeps calling the function until execute step done (string is printed in full)
                    // console auto creates the interrupt when its done
                    if(phase == 1) {
                        // extract first two digits of the PC to be the HOB
                        let context = (this.PC >> 8) & 0xFF;
                        this.MMU.setHob(context);
                        this.step++;
                    } else if (phase == 2) {
                        this.MMU.setLob(this.yReg);
                        if (this.console.outputString(this.MMU.endianAddress())) {
                            this.step = 0x6;
                        }
                    }
                } else if (this.xReg == 0x03) {  // string output from address (already in hob and lob)
                    // keeps calling the function until execute step done (string is printed in full)
                    // console auto creates the interrupt when its done
                    if (this.console.outputString(this.MMU.endianAddress())) {
                        this.step = 0x6;
                    }
                }
                break;
            }
        }
    }

    // write the new data after execute cycle back to memory
    private writeBack(): void {
        // send new data to MDR, MAR should not have changed
        this.MMU.setMdr(this.accumulator);
        this.MMU.writeToMem();
        this.step++;
    }

    // checks for interrupts and processes the queue if so
    private interruptCheck(): void {
        let interrupt = this.ICU.interruptCheck();
        // if we got an interrupt, don't move to next step until queue empty
        if (interrupt) {
            // swap to kernel mode
            this.mode = 1;
            // determine what kind of interrupt and how to handle it
            if (interrupt.Name == "Keyboard") {
                let key = interrupt.outputBuffer.shift();
                if (this.interruptDebug) {
                    // keys in buffer are encoded with ascii
                    this.log("Interrupt received: " + this.ascii.decode(key));
                }
                this.manageKeyInput(key);
            } else if (interrupt.Name = "Console") {
                this.console.display();
            }
        } else {
            this.mode = 0;
            this.step = 0;
        }
    }

    // provides status of all CPU registers for debugging
    private status(): string {
        return "CPU State | Mode: " + this.mode + " PC: " + super.hexLog(this.PC, 4).substring(2) +
            " IR: " + super.hexLog(this.IR, 2).substring(2) + " Acc: " + super.hexLog(this.accumulator, 2).substring(2) +
            " xReg: " + super.hexLog(this.xReg, 2).substring(2) + " yReg: " + super.hexLog(this.yReg, 2).substring(2) +
            " zFlag: " + Number(this.zFlag) + " Step: " + this.step;
    }

    // uses the ROM function to flash a static program to memory
    public loadStaticProgram(program: Array<number>, startingAddress: number): void {
        this.MMU.ROM(program, startingAddress);
    }

    /*
    have the cpu do something based on what the user pressed\
    remember that the keys are encoded in ascii
    d is for debug
    h is for hello
    m is for memory dump
    further functionality could be added 
    */
    private manageKeyInput(key: number): void {
        switch (key) {
            case (0x64): {  // d
                this.statusDebug = !this.statusDebug;
                this.log("Debug Mode toggled to " + this.statusDebug);
                break;
            } case (0x68): { // h
                this.log("Hello! (Input Test)");
                break;
            } case (0x6D): { // m
                this.MMU.memoryDump(0x0000, 0x0020);
                break;
            } default: {
                break;
            }
        }
    }

}
