import { AxerSpectro } from "../core/AxerSpectro";
import express, { json } from "express";
import timeout from "connect-timeout";
import { RouterManager } from "./RouterManager";
import { LoggerService } from "../helpers/terminal/LoggerService";
import { authorization } from "./middlewares/authorization";

export class SpectroServer {
  public axer: AxerSpectro;
  public routerManager: RouterManager;
  public router;
  public logger = new LoggerService("SpectroServer");

  constructor(axer: AxerSpectro) {
    this.axer = axer;
    this.router = express();

    this.router.bind(this.router);

    this.routerManager = new RouterManager(this.axer, this);

    this.router.use("*", json());
    this.router.use("*", authorization);
    this.router.use(timeout("60s"));
  }

  listen() {
    this.routerManager.loadRoutes();

    this.router.listen(process.env.PORT || 3000, () => {
      this.logger.printSuccess(
        `Server running on port ${process.env.PORT || 3000}`
      );
    });
  }
}
