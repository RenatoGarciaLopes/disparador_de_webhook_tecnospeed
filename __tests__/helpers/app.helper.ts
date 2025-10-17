import { ReenviarController } from "@/modules/webhook/interfaces/http/controllers/ReenviarController";
import { ReenviarRoutes } from "@/modules/webhook/interfaces/http/routes/ReenviarRoutes";
import express, { Express } from "express";

export class AppHelper {
  private static appInstance: Express;

  static createTestApp(): Express {
    if (!this.appInstance) {
      this.appInstance = express();
      this.appInstance.use(express.json());

      const reenviarRoutes = new ReenviarRoutes(new ReenviarController());
      this.appInstance.use(reenviarRoutes.router);
    }

    return this.appInstance;
  }

  static getApp(): Express {
    if (!this.appInstance) {
      return this.createTestApp();
    }
    return this.appInstance;
  }

  static resetApp(): void {
    this.appInstance = undefined as any;
  }
}
