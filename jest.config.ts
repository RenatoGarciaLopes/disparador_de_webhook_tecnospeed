import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],

  // Apenas testes unitários (no src/)
  testMatch: ["<rootDir>/src/**/*.test.ts"],

  // Ignorar testes de integração e e2e
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/integration/",
    "/__tests__/e2e/",
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
