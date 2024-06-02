import { Hardware } from "./Hardware";
import { InterruptController } from "./InterruptController";
import { Interrupt } from "./imp/Interrupt";
import { Ascii } from "./Ascii";

export class Keyboard extends Hardware implements Interrupt {

    public IRQ: number;
    public priority: number;
    public Name: string;
    public inputBuffer: Array<string>;
    public outputBuffer: Array<number> = [];
    private controller: InterruptController;
    private ascii: Ascii;
    public deviceDebug: boolean = false;

    constructor(controller: InterruptController, ascii: Ascii) {
        super("KBD", 0);
        this.monitorKeys();
        this.Name = "Keyboard";
        this.IRQ = 1;
        this.controller = controller;
        // arbitrary priority, all keys share this importance value
        this.priority = 4;
        this.ascii = ascii;
    }

    private monitorKeys(): void {
        /*
        character stream from stdin code (most of the contents of this function) taken from here
        https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin

        This takes care of the simulation we need to do to capture stdin from the console and retrieve the character.
        Then we can put it in the buffer and trigger the interrupt.
         */
        var stdin = process.stdin;

        // without this, we would only get streams once enter is pressed
        stdin.setRawMode(true);

        // resume stdin in the parent process (node app won't quit all by itself
        // unless an error or process.exit() happens)
        stdin.resume();

        // I don't want binary, do you?
        // stdin.setEncoding( 'utf8' );
        stdin.setEncoding(null);


        stdin.on('data', function (key) {
            // let keyPressed : String = key.charCodeAt(0).toString(2);
            // while(keyPressed.length < 8) keyPressed = "0" + keyPressed;
            let keyPressed: string = key.toString();

            if (this.deviceDebug) {
                this.log("Key pressed - " + keyPressed);
            }

            // ctrl-c ( end of text )
            // this let's us break out with ctrl-c
            if (key.toString() === '\u0003') {
                process.exit();
            }

            // write the key to stdout all normal like
            // process.stdout.write( key);
            // put the key value in the buffer
            // encode the incoming key with ascii
            this.outputBuffer.push(this.ascii.encode(keyPressed));

            // set the interrupt!
            this.controller.receiveInterrupt(this);

            // .bind(this) is required when running an asynchronous process in node that wishes to reference an
            // instance of an object.
        }.bind(this));
    }


}
