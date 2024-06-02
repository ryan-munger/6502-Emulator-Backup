export interface Interrupt {

    IRQ: number; // all interrupt generating devices have an irq num
    priority: number; // interrupts have priority
    Name: string; // name of device producing interrupt
    // not all devices need an inputbuffer so it is optional
    // not all devices need an outputbuffer (ex. the console output)
    // different devices may need different types in their buffers
    inputBuffer?: Array<any>; // holds incoming data 
    outputBuffer?: Array<any>; // holds outgoing data (ascii encoding)

}
