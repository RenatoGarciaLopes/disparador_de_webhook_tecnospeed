import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: [
    "<rootDir>/__tests__/integration/**/*.test.ts",
    "<rootDir>/__tests__/e2e/**/*.test.ts",
    "<rootDir>/src/**/*.test.ts",
  ],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "@/sequelize/(.*)": "<rootDir>/sequelize/$1",
    "@/sequelize": "<rootDir>/sequelize/index.ts",
    "@/(.*)": "<rootDir>/src/$1",
  },
  coveragePathIgnorePatterns: ["./sequelize/*", "node_modules/*"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/**/__tests__/**"],
};

export default config;
