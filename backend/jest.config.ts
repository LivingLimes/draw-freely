/**
 * Check https://github.com/LivingLimes/draw-freely/pull/18#issuecomment-2731114582 for a brief explanation on the configurations set below
 *
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest"

const config: Config = {
		
		// Coverage
		collectCoverage: true,
		coverageDirectory: "./__test__/coverage",
		coveragePathIgnorePatterns: [
				"/node_modules/",
		],
		coverageProvider: "v8",
		coverageReporters: [
				"json",
				"text",
				"lcov",
				"clover",
				"text-summary",
		],
		// Jest will fail if there is less than 80% branch, line, and function coverage, or if there are more than 10 uncovered statements:
		coverageThreshold: {
				global: {
						branches: 80,
						functions: 80,
						lines: 80,
						statements: -10
				}
		},

		
		// Test Environment
		testEnvironment: "jest-environment-node",
		testEnvironmentOptions: {},
		testMatch: [
		  "**/__tests__/**/*.[jt]s?(x)",
		  "**/?(*.)+(spec|test).[tj]s?(x)"
		],
		testPathIgnorePatterns: [
		  "/node_modules/"
		],
		
		// Miscellaneous
		moduleFileExtensions: [
				"ts",
				"tsx",
				"js",
				"jsx",
				"mjs",
				"cjs",
				"json",
				"node"
		],
		// The root directory that Jest should scan for tests and modules within
		rootDir: "src",
		transform: {
				"\\.[jt]sx?$": "ts-jest"
		},
		verbose: true,
		watchman: true,
}

export default config
