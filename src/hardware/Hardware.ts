export class Hardware {

    public debug: boolean = true;
    private id: number = null;
    private name: String = null;

    constructor(name: String, id: number) {
        this.name = name;
        this.id = id;
    }

    // system logging for debug true
    public log(message: string): void {
        if (this.debug) {
            const currentTimeMillis: number = new Date().getTime();
            console.log('[HW - ' + this.name + ' id: ' + this.id + ' - ' + currentTimeMillis + ']: ' + message);
        }
    }

    // takes a number and length and outputs formatted hex number
    public hexLog(num: number, len: number): string {
        let hex = num.toString(16).toUpperCase();
        // adds leading 0s to reach desired length
        if (hex.length < len) {
            let padding = len - hex.length;
            for (let i = 0; i < padding; i++) {
                hex = "0".concat(hex);
            }
        }
        hex = "0x".concat(hex);
        return hex;
    }

}
