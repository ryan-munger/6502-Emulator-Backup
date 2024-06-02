// import statements for hardware
import { Cpu } from "./hardware/Cpu";
import { Memory } from "./hardware/Memory";
import { MMU } from "./hardware/MMU";
import { Hardware } from "./hardware/Hardware";
import { Clock } from "./hardware/Clock";
import { Console } from "./hardware/Console";
import { InterruptController } from "./hardware/InterruptController";
import { Ascii } from "./hardware/Ascii";
import { Keyboard } from "./hardware/Keyboard";


// Clock cycle interval
// default is 500
const CLOCK_INTERVAL = 200; // This is in ms (milliseconds) so 1000 = 1 second, 100 = 1/10 second
// A setting of 100 is equivalent to 10hz, 1 would be 1,000hz or 1khz,
// .001 would be 1,000,000 or 1mhz. Obviously you will want to keep this

export class System extends Hardware {

    private _CPU: Cpu;
    private _RAM: Memory;
    private _CLK: Clock;
    private _MMU: MMU;
    private _OUT: Console;
    private _ICU: InterruptController;
    private _ASC: Ascii;
    private _Keyboard: Keyboard;
    private initDebug: boolean = false;
    private pulseDebug: boolean = false;
    private deviceDebug: boolean = false;
    private initMemDump: boolean = false;
    private staticProgram: boolean = false;
    private clockInterval = null;

    public running: boolean = false;

    constructor() {

        super('SYS', 0);

        // create the system's components
        this._RAM = new Memory();
        this._MMU = new MMU(this._RAM);
        this._ASC = new Ascii();
        this._ICU = new InterruptController();
        this._OUT = new Console(this._MMU, this._ASC, this._ICU);
        this._CPU = new Cpu(this._MMU, this._OUT, this._ICU, this._ASC);
        // Let the clock know what components are listening to it
        this._CLK = new Clock([this._CPU, this._RAM, this._MMU, this._ICU, this._ASC]);

        // manage devices, interrupts
        this._Keyboard = new Keyboard(this._ICU, this._ASC);
        this._ICU.addDevice(this._Keyboard);
        this._ICU.addDevice(this._OUT);

        /*
        Start the system (Analogous to pressing the power button and having voltages flow through the components)
        When power is applied to the system clock, it begins sending pulses to all clock observing hardware
        components so they can act on each clock cycle.
        */

        this.startSystem();

    }

    public startSystem(): boolean {
        // booleans that control all console output for debugging
        this._CPU.statusDebug = true;
        this._CPU.errorDebug = true;
        this.initDebug = true;
        this.pulseDebug = false;
        this.initMemDump = true;
        this.staticProgram = true;
        this.deviceDebug = true;

        // initialize memory
        this._RAM.init();

        if (this.initDebug) {
            this.log('Created');
            this._CPU.log('Created');
            this._RAM.log('Created');
            this._RAM.log('Initialized - Addressable space : ' + this._RAM.getAddressSpace());
            this._MMU.log('Created');
            this._CLK.log('Created');
            this._ICU.log('Created');
            this._ASC.log('Created');
            this.log("Welcome to the MOS 6502 Emulator! Press 'd' to toggle debug, 'h' for input test, and 'm' for memory dump. Programs statically loaded.");
        }

        if (this.deviceDebug) {
            this._Keyboard.log('Keyboard input configured');
            this._Keyboard.deviceDebug = true;
            this._OUT.log("Console output configured")
            this._CPU.interruptDebug = true;
        }

        // distribute pulsing debug information to listeners
        let listeners = [this._CPU, this._RAM, this._MMU, this._CLK, this._ICU, this._ASC];
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].pulseDebug = this.pulseDebug;
        }

        // start clock - will cycle at the given interval and cause the listeners to pulse
        this.clockInterval = setInterval(() => this._CLK.cycle(), CLOCK_INTERVAL);

        // load dummy program and prove it wrote to memory
        if (this.staticProgram) {
            let program: Array<number>;
            program = [0xA2, 0x02, 0xA0, 0x06, 0xFF, 0x00, 0x36, 0x35, 0x30, 0x32, 0x20, 0x54, 0x73, 0x69, 0x72,
                0x61, 0x6D, 0x20, 0x62, 0x79, 0x20, 0x52, 0x79, 0x61, 0x6E, 0x20, 0x4D, 0x75, 0x6E, 0x67, 0x65, 0x72, 0x00];
            this._CPU.loadStaticProgram(program, 0x0000);
        }
        // dump mem to ensure program write, see what program will run
        if (this.initMemDump) {
            this._RAM.memoryDump(0x0000, 0x0020);
        }

        return true;
    }

    public stopSystem(): void {
        // stop the clock, say goodbye, end program
        this.log("Goodbye!")
        clearInterval(this.clockInterval);
        process.exit();
    }

}

export let system: System = new System();
