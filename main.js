require.config({
    baseUrl: "src",
    paths: {
        "leaflet":           "bower_components/leaflet/dist/leaflet-src",
        "L.fullscreen":      "bower_components/Leaflet.fullscreen/dist/Leaflet.fullscreen",
        "L.providers":       "bower_components/leaflet-providers/leaflet-providers",
        "L.geosearch":       "bower_components/L.GeoSearch/src/js/l.control.geosearch",
        "L.geosearch.esri":  "bower_components/L.GeoSearch/src/js/l.geosearch.provider.esri",
        "L.markercluster":   "bower_components/leaflet.markercluster/dist/leaflet.markercluster-src",
        "L.awesomemarkers":  "bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers",
        // BASE DEPENDENCIES
        "jquery":            "bower_components/jquery/dist/jquery",
        "jquery.browser":    "bower_components/jquery.browser/dist/jquery.browser",
        "logging":           "bower_components/logging/src/logging",
        "pat-base":          "bower_components/patternslib/src/core/base",
        "pat-compat":        "bower_components/patternslib/src/core/compat",
        "pat-jquery-ext":    "bower_components/patternslib/src/core/jquery-ext",
        "pat-logger":        "bower_components/patternslib/src/core/logger",
        "pat-mockup-parser": "bower_components/patternslib/src/core/mockup-parser",
        "pat-parser":        "bower_components/patternslib/src/core/parser",
        "pat-registry":      "bower_components/patternslib/src/core/registry",
        "pat-utils":         "bower_components/patternslib/src/core/utils",
        "underscore":        "bower_components/underscore/underscore"

    },
    "shim": {
        "L.fullscreen": { deps: ["leaflet"] },
        "L.geosearch": { deps: ["leaflet"] },
        "L.geosearch.esri": { deps: ["leaflet"] },
        "L.markercluster": { deps: ["leaflet"] },
        "L.awesomemarkers": { deps: ["leaflet"] },
        "logging": { "exports": "logging" }
    },
    wrapShim: true
});

require(["jquery", "pat-registry", "pat-leaflet"], function($, registry, pattern) {
    window.patterns = registry;
    $(document).ready(function() {
        registry.init();
    });
});
