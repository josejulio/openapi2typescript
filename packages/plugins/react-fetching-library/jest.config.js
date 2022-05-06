module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: './coverage',
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/*.ts'
    ],
    roots: [
        '<rootDir>/tests'
    ],
    moduleNameMapper: {
        openapi2typescript: ["<rootDir>/../../core/src/index.ts"]
    }
};
