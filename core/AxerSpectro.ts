import { SpectroServer } from "../network/SpectroServer";

export class AxerSpectro {
  public server;

  constructor() {
    this.server = new SpectroServer(this);
  }

  initialize() {
    this.server.listen();
  }
}
