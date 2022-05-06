export enum BufferType {
    HEADER,
    COMPONENTS,
    OPERATIONS,
    FOOTER
}

export class Buffer {

    private readonly buffer: Array<Array<string>>;

    public constructor() {
        this.buffer = Object.values(BufferType).map(() => []);
    }

    public toString(): string {
        return this.buffer.map(b => b.join('')).join('\n');
    }

    public write(content: string, type: BufferType) {
        this.buffer[type].push(content);
    }
}
