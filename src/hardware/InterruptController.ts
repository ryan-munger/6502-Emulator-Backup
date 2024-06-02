import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";
import { Interrupt } from "./imp/Interrupt";

export class InterruptController extends Hardware implements ClockListener {

    private deviceList: Array<Hardware> = [];
    private interruptQueue: Array<Interrupt> = []; // managed as priority queue by sorting, push, & shift
    public pulseDebug: boolean = false;

    constructor() {
        super('ICU', 0);
    }

    public pulse(): void {
        if (this.pulseDebug) {
            super.log("Clock Pulse Received!");
        }
    }

    // receive interrupt from device
    public receiveInterrupt(event: Interrupt): void {
        this.interruptQueue.push(event);
        this.priorityQueue();
    }

    // track devices that create interrupts
    public addDevice(device: Hardware): void {
        this.deviceList.push(device);
    }

    // sorts the queue by priority value descending 
    // for this implementation we have two interrupt devices with differing priorities
    // console output is higher priority than keyboard input
    private priorityQueue(): void {
        this.interruptQueue.sort((a, b) => a.priority - b.priority);
    }

    // checks all devices for interrupt
    public interruptCheck(): Interrupt | void {
        this.priorityQueue();
        // remove and return the first interrupt 
        if (this.interruptQueue.length == 0) {
            return;
        }
        return this.interruptQueue.shift();
    }

    // returns the list of interrupt devices
    public getDevices(): Array<Hardware> {
        return this.deviceList;
    }

}
