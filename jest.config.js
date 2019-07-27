// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    collectCoverageFrom: [
        "workspace/js_src/**/*.js"
    ], 
    coverageDirectory: "report/coverage",
    browser: true,
    transformIgnorePatterns: [
        "/node_modules/",
        "/lib/"
    ]
};
