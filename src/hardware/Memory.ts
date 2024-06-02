import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";


export class Memory extends Hardware implements ClockListener {

    private mem: Array<number> = null;
    private MAR: number = 0x0000;
    private MDR: number = 0x00;
    public pulseDebug: boolean = false;


    constructor() {
        super('RAM', 0);
        // 64kb of memory with 2 hex digits (8 bits) in each element
        // needs 0x10000
        this.mem = new Array(0x10000);
    }

    // sets all memory registers to 0x00
    public init(): void {
        for (let i = 0x0000; i < this.mem.length; i += 0x0001) {
            this.mem[i] = 0x00;
        }
    }

    // either takes an address in memory to display or returns 0x00 to 0x14 by default
    // if address provided, the data is returned as string
    // no address provided: data is returned as a string array of values
    public displayMemory(address?: number): string {
        let display: string = "";
        if (address) {
            if (this.mem[address] != undefined) {
                display = "Address: " + super.hexLog(address, 4) + " Contains Value: " + super.hexLog(this.mem[address], 2);
            } else {
                display = "Address: " + super.hexLog(address, 4) + " Contains Value: ERR [Memory Access]: Address Invalid";
            }
            return display;
        } else {
            // makes a string that displays like a table, tabs are for an indent
            display += "\n";
            for (let i = 0x0000; i <= 0x0014; i += 0x0001) {
                display += "\tAddress" + super.hexLog(i, 4) + " Contains Value: " + super.hexLog(this.mem[i], 2) + "\n";
            }
            return display;
        }
    }

    // prints memory to the console from a starting to ending address in a table
    public memoryDump(start: number, end: number): void {
        super.log("Memory Dump: Debug");
        super.log("------------------------");
        for (let i = start; i <= end; i += 0x0001) {
            super.log("Addr " + super.hexLog(i, 4).substring(2) + ":    | " + super.hexLog(this.mem[i], 2).substring(2));
        }
        super.log("------------------------");
        super.log("Memory Dump: Complete");
    }

    // every clock cycle, log that pulse was received
    public pulse(): void {
        if (this.pulseDebug) {
            this.log("Received clock pulse");
        }
    }

    // All members overwritten with 0x0’s including entire memory array
    public reset(): void {
        for (let i = 0x0000; i < this.mem.length; i += 0x0001) {
            this.mem[i] = 0x00;
        }
        this.setMar(0x0000);
        this.setMdr(0x00);
    }

    // read memory at the location in the MAR and update the MDR
    public read(): void {
        this.MDR = this.mem[this.MAR];
    }

    //  write the contents of the MDR to memory at the location indicated by the MAR
    public write(): void {
        this.mem[this.MAR] = this.MDR;
    }

    // getters and setters
    public setMar(address: number): void {
        this.MAR = address;
    }

    public getMar(): number {
        return this.MAR;
    }

    public setMdr(data: number): void {
        this.MDR = data;
    }

    public getMdr(): number {
        return this.MDR;
    }

    public getAddressSpace(): number {
        return this.mem.length;
    }

}
