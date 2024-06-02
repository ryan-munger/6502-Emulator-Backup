import { Hardware } from "./Hardware";
import { MMU } from "./MMU";
import { Ascii } from "./Ascii";
import { Interrupt } from "./imp/Interrupt";
import { InterruptController } from "./InterruptController";

export class Console extends Hardware implements Interrupt {

    private MMU: MMU;
    public inputBuffer: Array<string | number> = [];
    public IRQ: number;
    public priority: number;
    public Name: string;
    private stringBuilder: Array<String> = [];
    private controller: InterruptController;
    private memOffset: number = 0;
    private ascii: Ascii;

    constructor(MMU: MMU, ascii: Ascii, controller: InterruptController) {
        super("CON", 0);
        this.MMU = MMU;
        this.ascii = ascii;
        this.IRQ = 2;
        this.priority = 1; // output to console is very important
        this.Name = "Console";
        this.controller = controller;
    }

    // outputs contents of a register
    public outputReg(output: number): void {
        this.log(super.hexLog(output, 2) + '');
    }

    // sends first item in buffer to the console
    public display(): void {
        let output = this.inputBuffer.shift();

        if (typeof output === "number") {
            this.outputReg(output);
        } else {
            this.log(output);
        }

    }

    // takes things the cpu wants to display and creates an interrupt
    public acceptOutput(output: number | string): void {
        this.inputBuffer.push(output);
        this.controller.receiveInterrupt(this);
    }

    // outputs a 0x00 terminated string starting at an address
    // builds the string in a buffer and outputs it all at once
    // offset is used because cpu keeps passing starting address
    public outputString(startingAddress: number): boolean {
        let nextChar = this.MMU.readImmediate(startingAddress + this.memOffset);
        if (nextChar == 0x00) {
            this.acceptOutput(this.stringBuilder.join(''));
            this.stringBuilder = [];
            this.memOffset = 0;
            return true;
        } else {
            this.stringBuilder.push(this.ascii.decode(nextChar));
            this.memOffset++;
        }
        return false;
    }

}
