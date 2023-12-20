import { Request, Response } from "express";
import { AxerSpectro } from "../../core/AxerSpectro";
import { LoggerService } from "../../helpers/terminal/LoggerService";

export enum RouteMethod {
  GET = "get",
  POST = "post",
  DELETE = "delete",
  PATCH = "patch",
}

export class Route {
  public path: string;
  public method: RouteMethod = RouteMethod.GET;
  public executableFunction!: (
    axer: AxerSpectro,
    route: typeof this,
    req: Request,
    res: Response
  ) => void;
  private logger: LoggerService;

  constructor(path: string, method?: RouteMethod) {
    this.path = path;
    this.method = method || this.method;

    this.logger = new LoggerService(`Route[${this.path}]::${this.method}`);
  }

  setExecutable(
    fn: (
      axer: AxerSpectro,
      route: typeof this,
      req: Request,
      res: Response
    ) => void
  ) {
    this.executableFunction = fn;

    return this;
  }

  execute(axer: AxerSpectro, req: Request, res: Response) {
    try {
      this.executableFunction(axer, this, req, res);

      this.logger.printSuccess("Request handled!");
    } catch (e) {
      this.logger.printError("Can't handle request!", e);

      this.handleError(res, 500, "Internal server error");
    }
  }

  handleResponse<T>(res: Response, data: T, message?: string) {
    res.status(200).send({
      status: 200,
      statusText: message || "OK",
      data,
    });
  }

  handleError(res: Response, status: number, message?: string) {
    res.status(status).send({
      status,
      statusText: message || "Unknown error",
    });
  }
}
