import express from "express";
import { App } from "./app";
import { ReenviarController } from "./modules/webhook/interfaces/http/controllers/ReenviarController";
import { ReenviarRoutes } from "./modules/webhook/interfaces/http/routes/ReenviarRoutes";

// --- Mocks ---
jest.mock("express");
jest.mock("./modules/webhook/interfaces/http/routes/ReenviarRoutes");
jest.mock("./modules/webhook/interfaces/http/controllers/ReenviarController");
jest.mock("./infrastructure/config", () => ({
  config: { NODE_ENV: "test" },
}));

describe("App", () => {
  const mockUse = jest.fn();
  const mockListen = jest.fn().mockReturnThis();
  const mockOn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // express() mock returns an object with use, listen, etc.
    (express as unknown as jest.Mock).mockReturnValue({
      use: mockUse,
      listen: mockListen.mockImplementation((_port, cb) => {
        cb?.(); // call the callback immediately
        return { on: mockOn };
      }),
      json: jest.fn(),
    });
  });

  it("should configure express, middlewares, and routes", () => {
    const app = new App();

    // ReenviarRoutes must be instantiated with a ReenviarController
    expect(ReenviarRoutes).toHaveBeenCalledTimes(1);
    expect(ReenviarController).toHaveBeenCalledTimes(1);

    // Middleware and routes applied to express app
    expect(mockUse).toHaveBeenCalled();
  });

  it("should start the server and log environment info", () => {
    const app = new App();

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    app.start(4000);

    expect(mockListen).toHaveBeenCalledWith(4000, expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith("--------------------------------");
    expect(logSpy).toHaveBeenCalledWith("TecnoSpeed - Webhook Dispatcher");
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("🌐 Environment: test"),
    );
    expect(mockOn).toHaveBeenCalledWith("error", console.error);

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
