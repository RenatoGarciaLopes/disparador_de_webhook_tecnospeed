import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],

  moduleNameMapper: {
    "@/sequelize/(.*)": "<rootDir>/sequelize/$1",
    "@/sequelize": "<rootDir>/sequelize/index.ts",
    "@/(.*)": "<rootDir>/src/$1",
  },

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts",
    "!src/server.ts",
    "!src/**/docs/*",
  ],

  coveragePathIgnorePatterns: ["./sequelize/*", "node_modules/*"],
  clearMocks: true,
};

export default config;
