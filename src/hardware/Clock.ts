import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";

export class Clock extends Hardware {

    private listeners: Array<ClockListener> = null;
    public pulseDebug: boolean = false;

    // the clock gets told who is listening to it
    constructor(components: Array<ClockListener>) {
        super('CLK', 0);
        this.listeners = components;
    }

    // every interval, make each listener pulse
    public cycle(): void {
        if (this.pulseDebug) {
            super.log("Clock Pulse Initialized");
        }

        for (let i in this.listeners) {
            this.listeners[i].pulse();
        }
    }

}
