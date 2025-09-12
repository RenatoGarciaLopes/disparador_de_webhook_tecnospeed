import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "@/sequelize": "<rootDir>/sequelize/index.ts",
    "@/sequelize/*": "<rootDir>/sequelize/$1",
    "@/(.*)": "<rootDir>/src/$1",
  },
};

export default config;
