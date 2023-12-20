import { Readable } from "stream";

export function bufferToStream(binary: Buffer) {
  return new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });
}
