import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>"],
  testMatch: ["<rootDir>/__tests__/integration/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],

  moduleNameMapper: {
    "@/sequelize/(.*)": "<rootDir>/sequelize/$1",
    "@/sequelize": "<rootDir>/sequelize/index.ts",
    "@/(.*)": "<rootDir>/src/$1",
  },

  globalSetup: "<rootDir>/__tests__/integration/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/__tests__/integration/setup/globalTeardown.ts",
  setupFilesAfterEnv: ["<rootDir>/__tests__/integration/setup/testHelpers.ts"],

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/server.ts",
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  testTimeout: 10000,
  verbose: true,
  maxWorkers: 1,
};

export default config;
