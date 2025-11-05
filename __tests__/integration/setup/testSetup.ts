import { TestDataHelper } from "../helpers/test-data.helper";

export class TestSetup {
  static async globalSetup() {
    await TestDataHelper.initialize();
  }

  static async globalTeardown() {
    await TestDataHelper.cleanup();
  }

  static async beforeEach() {
    await TestDataHelper.cleanup();
  }

  static async afterEach() {
    await TestDataHelper.cleanup();
  }
}
