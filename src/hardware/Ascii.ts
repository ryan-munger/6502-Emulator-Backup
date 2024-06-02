import { Hardware } from "./Hardware";
import { ClockListener } from "./imp/ClockListener";

export class Ascii extends Hardware implements ClockListener {

    public pulseDebug: boolean = false;

    constructor() {
        super("ASC", 0);
    }

    // returns ascii code of specified char
    public encode(char: string): number {
        return reverseAsciiMap[char];
    }

    // returns char of specified ascii code
    public decode(code: number): string {
        return asciiMap[code];
    }

    public pulse(): void {
        if (this.pulseDebug) {
            super.log("Clock Pulse Received!");
        }
    }

}

// map for each ascii code to corresponding char
// has all 128 standard chars
// I did not implement the extended ascii table as it is not relevant for this project
const asciiMap: { [key: number]: string } = {
    0x00: '\0',   // Null character 
    0x01: '\u0001',   // Start of Heading
    0x02: '\u0002',   // Start of Text
    0x03: '\u0003',   // End of Text
    0x04: '\u0004',   // End of Transmission
    0x05: '\u0005',   // Enquiry
    0x06: '\u0006',   // Acknowledge
    0x07: '\u0007',   // Bell
    0x08: '\b',   // Backspace
    0x09: '\t',   // Tab
    0x0A: '\n',  // New Line
    0x0B: '\u000B',  // Vertical Tab
    0x0C: '\f',  // Form Feed
    0x0D: '\r',  // Carriage Return
    0x0E: '\u000E',  // Shift Out
    0x0F: '\u000F',  // Shift In
    0x10: '\u0010',  // Data Link Escape
    0x11: '\u0011',  // Device Control 1 (XON)
    0x12: '\u0012',  // Device Control 2
    0x13: '\u0013',  // Device Control 3 (XOFF)
    0x14: '\u0014',  // Device Control 4
    0x15: '\u0015',  // Negative Acknowledge
    0x16: '\u0016',  // Synchronous Idle
    0x17: '\u0017',  // End of Transmission Block
    0x18: '\u0018',  // Cancel
    0x19: '\u0019',  // End of Medium
    0x1A: '\u001A',  // Substitute
    0x1B: '\u001B',  // Escape
    0x1C: '\u001C',  // File Separator
    0x1D: '\u001D',  // Group Separator
    0x1E: '\u001E',  // Record Separator
    0x1F: '\u001F',  // Unit Separator
    0x20: ' ', 0x21: '!', 0x22: '"', 0x23: '#', 0x24: '$', 0x25: '%', 0x26: '&', 0x27: "'", 0x28: '(', 0x29: ')', 0x2A: '*', 0x2B: '+',
    0x2C: ',', 0x2D: '-', 0x2E: '.', 0x2F: '/', 0x30: '0', 0x31: '1', 0x32: '2', 0x33: '3', 0x34: '4', 0x35: '5', 0x36: '6', 0x37: '7',
    0x38: '8', 0x39: '9', 0x3A: ':', 0x3B: ';', 0x3C: '<', 0x3D: '=', 0x3E: '>', 0x3F: '?', 0x40: '@', 0x41: 'A', 0x42: 'B', 0x43: 'C',
    0x44: 'D', 0x45: 'E', 0x46: 'F', 0x47: 'G', 0x48: 'H', 0x49: 'I', 0x4A: 'J', 0x4B: 'K', 0x4C: 'L', 0x4D: 'M', 0x4E: 'N', 0x4F: 'O',
    0x50: 'P', 0x51: 'Q', 0x52: 'R', 0x53: 'S', 0x54: 'T', 0x55: 'U', 0x56: 'V', 0x57: 'W', 0x58: 'X', 0x59: 'Y', 0x5A: 'Z', 0x5B: '[',
    0x5C: '\\', 0x5D: ']', 0x5E: '^', 0x5F: '_', 0x60: '`', 0x61: 'a', 0x62: 'b', 0x63: 'c', 0x64: 'd', 0x65: 'e', 0x66: 'f', 0x67: 'g',
    0x68: 'h', 0x69: 'i', 0x6A: 'j', 0x6B: 'k', 0x6C: 'l', 0x6D: 'm', 0x6E: 'n', 0x6F: 'o', 0x70: 'p', 0x71: 'q', 0x72: 'r', 0x73: 's',
    0x74: 't', 0x75: 'u', 0x76: 'v', 0x77: 'w', 0x78: 'x', 0x79: 'y', 0x7A: 'z', 0x7B: '{', 0x7C: '|', 0x7D: '}', 0x7E: '~',
    0x7F: '\u007F' // Delete
};

// contains the map for each char to ascii code
const reverseAsciiMap: { [key: string]: number } = {};

// make the reverse map using the other map
for (const code in asciiMap) {
    const character = asciiMap[code];
    reverseAsciiMap[character] = parseInt(code, 10);
}
