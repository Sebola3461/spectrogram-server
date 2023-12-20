import path from "path";
import ffmpeg, { FfprobeData, ffprobe } from "fluent-ffmpeg";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import crypto from "crypto";
import { exec } from "child_process";
import { EventEmitter } from "events";

export class AudioSpectrogram extends EventEmitter {
  private FFMPEG_PATH = path.resolve("./bin/ffmpeg.exe");
  private FFPROBE_PATH = path.resolve("./bin/ffprobe.exe");
  private StaticImagePathBase = path.resolve(`./temp/`);
  private StaticAudioPathBase = path.resolve(`./temp/`);
  private PythonModule = "./spectrogram/python/spectrogram.py";
  private FFMPEG = ffmpeg;
  private FileId!: string;
  private Audio!: string;
  private Image!: Buffer;
  private originalFileType: string = "mp3";

  constructor() {
    super();

    if (process.platform == "win32") {
      this.FFMPEG.setFfmpegPath(this.FFMPEG_PATH);
      this.FFMPEG.setFfprobePath(this.FFPROBE_PATH);
    }

    this.validatePaths();
    this.generateId();
  }

  public static isMimeValid(mimetype: string | null) {
    if (!mimetype) return false;

    const validTypes = ["audio/mpeg", "audio/ogg", "audio/x-wav", "audio/wav"];

    return validTypes.includes(mimetype);
  }

  public static isFileSizeValid(bytes: number | null) {
    if (!bytes) return false;

    return bytes <= 1.5e7;
  }

  public deleteFiles() {
    try {
      unlinkSync(
        path.join(
          this.getImageStaticPathBase(),
          this.getFileId().concat(".png")
        )
      );

      unlinkSync(
        path.join(
          this.getAudioStaticPathBase(),
          this.getFileId().concat(".wav")
        )
      );
    } catch (e) {
      void {};
    }
  }

  setAudioURL(audio: string) {
    this.Audio = audio;

    return this;
  }

  setAudioFilename(type: string) {
    this.originalFileType = type;

    return this;
  }

  saveAudioFile() {
    return new Promise((resolve, reject) => {
      ffmpeg(this.Audio)
        .saveToFile(
          path.join(
            this.getAudioStaticPathBase(),
            this.getFileId().concat(`.${this.originalFileType}`)
          )
        )
        .on("end", resolve)
        .on("error", reject);
    });
  }

  getAudioInfo(): Promise<FfprobeData | null> {
    return new Promise((resolve, reject) => {
      if (!this.Audio) return resolve(null);

      ffprobe(
        path.join(
          this.getAudioStaticPathBase(),
          this.getFileId().concat(`.${this.originalFileType}`)
        ),
        (err, data) => {
          if (err) {
            unlinkSync(
              path.join(
                this.getAudioStaticPathBase(),
                this.getFileId().concat(`.${this.originalFileType}`)
              )
            );
            return resolve(null);
          }

          resolve(data);

          unlinkSync(
            path.join(
              this.getAudioStaticPathBase(),
              this.getFileId().concat(`.${this.originalFileType}`)
            )
          );
        }
      );
    });
  }

  public async getBitRate() {
    const audioData = await this.getAudioInfo();

    if (!audioData) return "Unknown";

    const sanitizedBitRate = Math.round(
      Number(audioData.format.bit_rate) / 1000
    );

    const result = audioData.format.bit_rate
      ? `${!isNaN(sanitizedBitRate) ? sanitizedBitRate : "Unknown"}Kb/s`
      : "Unknown";

    return result;
  }

  private getFileId() {
    return this.FileId;
  }

  private getImageStaticPathBase() {
    return this.StaticImagePathBase;
  }

  private getAudioStaticPathBase() {
    return this.StaticAudioPathBase;
  }

  async start() {
    this.FFMPEG.bind(this);
    this.startPythonProcess.bind(this);
    this.getBitRate.bind(this);
    this.getFileId.bind(this);
    this.getImageStaticPathBase.bind(this);
    this.getAudioStaticPathBase.bind(this);

    await this.saveAudio();

    await this.startPythonProcess();
  }

  private saveAudio() {
    return new Promise((resolve, reject) => {
      this.FFMPEG(this.Audio)
        .saveToFile(
          path.join(
            this.getAudioStaticPathBase(),
            this.getFileId().concat(`.${this.originalFileType}`)
          )
        )
        .on("end", resolve)
        .on("error", (e) => {
          reject(e);
        });
    });
  }

  private setImage(image: Buffer) {
    this.Image = image;
  }

  private getImage() {
    return this.Image;
  }

  private async startPythonProcess() {
    this.emit.bind(this);
    this.getFileId.bind(this);
    this.getAudioStaticPathBase.bind(this);
    this.getImageStaticPathBase.bind(this);
    this.setImage.bind(this);

    exec(
      `python3 ${this.PythonModule} ${this.getFileId().concat(
        ".wav"
      )} ${await this.getBitRate()}`,
      (error, stdout, stderr) => {
        if (error !== null) return this.emit("error", error);

        this.setImage(
          readFileSync(
            path.join(
              this.getImageStaticPathBase(),
              this.getFileId().concat(".png")
            )
          )
        );

        this.emit("data", this.getImage());

        unlinkSync(
          path.join(
            this.getAudioStaticPathBase(),
            this.getFileId().concat(".wav")
          )
        );
      }
    );
  }

  generateId() {
    return (this.FileId = crypto.randomBytes(10).toString("hex"));
  }

  validatePaths() {
    if (!existsSync(this.getImageStaticPathBase()))
      mkdirSync(this.getImageStaticPathBase());

    if (!existsSync(this.getAudioStaticPathBase()))
      mkdirSync(this.getAudioStaticPathBase());
  }
}
