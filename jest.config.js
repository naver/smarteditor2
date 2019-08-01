// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    collectCoverageFrom: [
        "workspace/js_src/**/*.js"
    ], 
    coverageDirectory: "report/coverage",
    browser: true,
    moduleNameMapper: {
        "^@static(.*)$": "<rootDir>/workspace/static$1",
        "^@src(.*)$": "<rootDir>/workspace/js_src$1"
    },
    transformIgnorePatterns: [
        "/node_modules/",
        "/lib/"
    ]
};
