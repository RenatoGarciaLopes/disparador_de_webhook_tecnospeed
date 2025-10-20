import { jest } from "@jest/globals";

jest.mock("express", () => ({
  Router: jest.fn(() => ({
    /* router "vazio" */
  })),
}));

import { Router } from "express";
import { RouterImplementation } from "./RouterImplementation";

describe("[SHARED] RouterImplementation (constructor)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  class MinimalRouter extends RouterImplementation {
    protected configure(): void {}
  }

  it("deve instanciar um Router do express ao construir (this.router definido)", () => {
    const instance = new MinimalRouter();
    expect(Router).toHaveBeenCalledTimes(1);
    expect(instance.router).toBeDefined();
  });

  it("deve chamar configure() exatamente uma vez durante a construção", () => {
    const configureSpy = jest.spyOn(
      MinimalRouter.prototype as any,
      "configure",
    );
    new MinimalRouter();
    expect(configureSpy).toHaveBeenCalledTimes(1);
  });

  it("deve instanciar um Router novo por instância (sem compartilhar estado)", () => {
    const a = new MinimalRouter();
    const b = new MinimalRouter();

    expect(Router).toHaveBeenCalledTimes(2);
    expect(a).not.toBe(b);
    expect(a.router).not.toBe(b.router);
  });

  it("ordem: Router() deve ser chamado antes de configure()", () => {
    const configureSpy = jest.spyOn(
      MinimalRouter.prototype as any,
      "configure",
    );

    new MinimalRouter();

    const routerCall = (Router as jest.Mock).mock.invocationCallOrder[0];
    const configureCall = configureSpy.mock.invocationCallOrder[0];
    expect(routerCall).toBeLessThan(configureCall);
  });
});
