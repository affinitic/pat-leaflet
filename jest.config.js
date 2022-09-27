const config = require("@patternslib/dev/jest.config.js");

config.transformIgnorePatterns = [
    "/node_modules/(?!@patternslib/)(?!@plone/)(?!preact/)(?!screenfull/)(?!leaflet-geosearch/).+\\.[t|j]sx?$",
];

module.exports = config;
