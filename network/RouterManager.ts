import { AxerSpectro } from "../core/AxerSpectro";
import { LoggerService } from "../helpers/terminal/LoggerService";
import { SpectroServer } from "./SpectroServer";
import { AvailableRoutes } from "./routes";
import { Route, RouteMethod } from "./struct/Route";

export class RouterManager {
  public routes: Route[] = [];
  public axer: AxerSpectro;
  public server: SpectroServer;
  private logger = new LoggerService("RouteManager");

  constructor(axer: AxerSpectro, server: SpectroServer) {
    this.axer = axer;
    this.server = server;
  }

  loadRoutes() {
    this.routes = AvailableRoutes;

    for (const route of this.routes) {
      switch (route.method) {
        case RouteMethod.POST:
          this.server.router.post.bind(this.server.router)(
            route.path,
            (req, res) => route.execute(this.axer, req, res)
          );
          break;
        case RouteMethod.GET:
          this.server.router.get.bind(this.server.router)(
            route.path,
            (req, res) => route.execute(this.axer, req, res)
          );
          break;
        case RouteMethod.DELETE:
          this.server.router.delete.bind(this.server.router)(
            route.path,
            (req, res) => route.execute(this.axer, req, res)
          );
          break;
        case RouteMethod.PATCH:
          this.server.router.patch.bind(this.axer.server.router)(
            route.path,
            (req, res) => route.execute(this.axer, req, res)
          );
          break;
      }

      this.logger.printInfo(`Initialized::[${route.path}]`);
    }
  }
}
