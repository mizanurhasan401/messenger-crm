/** Unit-test config (e2e uses test/jest-e2e.json). */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@messenger/shared$": "<rootDir>/../../../packages/shared/src/index.ts",
    "^@messenger/database$": "<rootDir>/../../../packages/database/src/index.ts",
  },
};
