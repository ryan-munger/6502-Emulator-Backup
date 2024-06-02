import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";
import { Memory } from "./Memory";

export class MMU extends Hardware implements ClockListener {

    private memory: Memory;
    private hob: number = null;
    private lob: number = null;
    public pulseDebug = false;

    constructor(mem: Memory) {
        super('MMU', 0);
        this.memory = mem;
    }

    public pulse(): void {
        if (this.pulseDebug) {
            this.log("Received clock pulse");
        }
    }

    // writes content of MDR to MAR address
    // if we have a low order and high order bite, use them. else use what's already in the MAR
    // we reset the lob and hob. these will be specified again if a load is called for example
    public writeToMem(): void {
        if (this.lob === null && this.hob === null) {
            this.memory.write();
        } else {
            this.setMar(this.endianAddress());
            this.memory.write();
            this.lob = null;
            this.hob = null;
        }
    }

    // passes down reset call to memory
    public reset(): void {
        this.memory.reset();
    }

    // take our low and high order bytes and combine them into a full address for usage
    public endianAddress(): number {
        // return Number(super.hexLog(this.hob, 2).substring(2).concat(super.hexLog(this.lob, 2).substring(2)));
        return Number('0x' + super.hexLog(this.hob, 2).substring(2).concat(super.hexLog(this.lob, 2).substring(2)));
    }

    // sets MDR to the contents of address MAR and returns it
    // if we have a low order and high order bite, use them. else use what's already in the MAR
    public readFromMem(): number {
        if (this.lob === null && this.hob === null) {
            this.memory.read();
        } else {
            this.memory.setMar(this.endianAddress());
            this.memory.read();
            this.lob = null;
            this.hob = null;
        }
        return this.memory.getMdr();
    }

    // reads directly from fully specified address
    public readImmediate(address: number): number {
        this.setMar(address);
        this.memory.read();
        return this.memory.getMdr();
    }

    // takes a static program from the cpu and puts it in memory
    public ROM(program: Array<number>, startingAddress: number): string {
        let address = startingAddress;
        for (let i = 0; i < program.length; i++) {
            this.writeImmediate(address, program[i]);
            address += 0x0001;
        }
        return 'Program Loaded';
    }

    // passes call down to memory
    public memoryDump(start: number, end: number): void {
        this.memory.memoryDump(start, end);
    }

    // passes down to memory
    public displayMemory(address?: number): string {
        if (address) {
            return this.memory.displayMemory(address);
        }
        return this.memory.displayMemory();
    }

    // writes data to fully specified address immediately, handles the mar and the mdr itself
    public writeImmediate(address: number, data: number): void {
        this.setMar(address);
        this.setMdr(data);
        this.writeToMem();
    }

    // getters and setters
    public setLob(data: number): void {
        if (data.toString(16).length <= 2) {
            this.lob = data;
        }
    }

    public setHob(data: number): void {
        // make sure the data is not too large to be a lob or hob
        if (data.toString(16).length <= 2) {
            this.hob = data;
        }
    }

    public setMdr(data: number): void {
        // make sure the data can fit in the 8 bit word size
        if (data.toString(16).length <= 2) {
            this.memory.setMdr(data);
        }
    }

    public getMdr(): number {
        return this.memory.getMdr();
    }

    public getMar(): number {
        return this.memory.getMar();
    }

    // this might be used when reading PC, accum
    public setMar(address: number): void {
        // make sure the address is not too large (leading 0's don't count)
        if (address.toString(16).length <= 4) {
            this.memory.setMar(address);
        }
    }

}
