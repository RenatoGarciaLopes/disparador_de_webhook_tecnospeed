import { Router } from "express";

export abstract class RouterImplementation {
  public readonly router: Router;

  constructor() {
    this.router = Router();
    this.configure();
  }

  protected abstract configure(): void;
}
