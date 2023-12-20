import axios from "axios";
import { LoggerService } from "./LoggerService";
import { filetypemime } from "magic-bytes.js";

export class AudioDownloader {
  public url: string;
  public validDomains = String(process.env.VALID_AUDIO_DOMAINS)
    .split(",")
    .map((domain) => domain.toLocaleLowerCase().trim());
  public validMimeTypes = [
    "audio/mpeg",
    "audio/ogg",
    "audio/x-wav",
    "audio/wav",
  ];
  private logger = new LoggerService("AudioDownloader");

  constructor(url: string) {
    this.url = url.trim();
  }

  download() {
    this.logger.printInfo(`${this.url} | Downloading audio...`);

    return new Promise(async (resolve, reject) => {
      try {
        const audioBuffer = await axios(this.url);

        const mimeType = filetypemime(Buffer.from(audioBuffer.data));

        if (!mimeType || !this.validMimeTypes.includes(mimeType[0]))
          return reject({
            status: 400,
            statusText: "Invalid audio file type",
            data: null,
          });

        return resolve({
          status: 200,
          statusText: "Ok",
          data: Buffer.from(audioBuffer.data),
        });
      } catch (e) {
        this.logger.printError(`${this.url} | Can't download audio...`);
        console.error(e);

        return reject({
          status: 400,
          statusText: "Can't download audio!",
          data: null,
        });
      }
    }) as Promise<{ status: 200; statusText: string; data: Buffer }>;
  }

  hasAllowedURL() {
    try {
      const url = new URL(this.url);

      return this.validDomains.includes(url.hostname);
    } catch (e) {
      return false;
    }
  }
}
