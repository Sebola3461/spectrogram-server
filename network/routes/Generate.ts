import { ExecException } from "child_process";
import { AudioDownloader } from "../../helpers/terminal/AudioDownloader";
import { AudioSpectrogram } from "../../spectrogram/AudioSpectrogram";
import { Route, RouteMethod } from "../struct/Route";
import { filetypeextension } from "magic-bytes.js";

export const Generate = new Route("/generate", RouteMethod.POST).setExecutable(
  async (axer, route, req, res) => {
    const bodyData = req.body as { audio?: string };

    if (!bodyData) return route.handleError(res, 400, "Invalid form body");

    if (!bodyData.audio || typeof bodyData.audio != "string")
      return route.handleError(
        res,
        400,
        "Invalid form body::Missing or invalid audio field"
      );

    const audioDownloader = new AudioDownloader(bodyData.audio);

    if (!audioDownloader.hasAllowedURL())
      return route.handleError(
        res,
        401,
        "Invalid form body::This host isn't allowed"
      );

    audioDownloader
      .download()
      .then((audio) => {
        const spectro = new AudioSpectrogram();

        spectro.setAudioFilename(filetypeextension(audio.data)[0] || "mp3");
        spectro.setAudioURL(audioDownloader.url);
        spectro.validatePaths();
        spectro
          .start()
          .then(() => {
            spectro
              .on("data", (image: Buffer) => {
                res.status(200).send({
                  status: 200,
                  statusText: "Ok",
                  data: spectro.deleteFiles(),
                });

                spectro.deleteFiles();
              })
              .on("error", (error: ExecException) => {
                route.handleError(res, 500, "Internal server error");
                console.error(error);

                spectro.deleteFiles();
              });
          })
          .catch((e) => {
            route.handleError(res, 500, "Internal server error");

            spectro.deleteFiles();

            console.error(e);
          });
      })
      .catch((error) => {
        route.handleError(
          res,
          500,
          `Internal server error::${error.statusText || "Unknown"}`
        );

        console.error(error);
      });
  }
);
