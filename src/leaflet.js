import $ from "jquery";
import Base from "@patternslib/patternslib/src/core/base";
import Parser from "@patternslib/patternslib/src/core/parser";
import logging from "@patternslib/patternslib/src/core/logging";

var log = logging.getLogger("pat-leaflet");
log.debug("pattern loaded");

export const parser = new Parser("leaflet");

parser.addArgument("latitude", "0.0");
parser.addArgument("longitude", "0.0");
parser.addArgument("zoom", "14");

parser.addArgument("maxClusterRadius", "80");

parser.addArgument("boundsPadding", "20");

// default controls
parser.addArgument("fullscreencontrol", true);
parser.addArgument("zoomcontrol", true);

// disabled controls
parser.addArgument("addmarker", false);
parser.addArgument("autolocate", false);
parser.addArgument("geosearch", false);
parser.addArgument("geosearch_provider", "openstreetmap");
parser.addArgument("locatecontrol", false);
parser.addArgument("minimap", false);

// map layers
parser.addArgument("default_map_layer", { id: "OpenStreetMap.Mapnik", options: {} });
parser.addArgument("map_layers", [
    { title: "Map", id: "OpenStreetMap.Mapnik", options: {} },
    { title: "Satellite", id: "Esri.WorldImagery", options: {} },
    { title: "Topographic", id: "OpenTopoMap", options: {} },
    { title: "Toner", id: "Stamen.Toner", options: {} },
]);

parser.addArgument("image_path", "node_modules/leaflet.awesome-markers/dist/images");

export default Base.extend({
    name: "leaflet",
    trigger: ".pat-leaflet",
    map: undefined,
    parser: parser,

    async init() {
        import("./leaflet.scss");

        const L = (await import("leaflet")).default;
        const LMarkerClusterGroup = (await import("leaflet.markercluster")).MarkerClusterGroup; // prettier-ignore
        const {
            GeoSearchControl,
            EsriProvider,
            GoogleProvider,
            BingProvider,
            OpenStreetMapProvider,
        } = await import("leaflet-geosearch");

        await import("leaflet-minimap");
        await import("leaflet-providers");
        await import("leaflet-sleep");
        await import("leaflet.awesome-markers");
        await import("leaflet.fullscreen");
        await import("leaflet.locatecontrol");
        await import("leaflet.simplemarkers/lib/Control.SimpleMarkers");

        var self = this;

        // BBB: remove jquery dependency in the future
        self.$el = $(self.el);

        var options = (self.options = parser.parse(self.el));

        var fitBoundsOptions = (self.fitBoundsOptions = {
            maxZoom: options.zoom,
            padding: [parseInt(options.boundsPadding), parseInt(options.boundsPadding)],
        });

        var main_marker = (self.main_marker = null);

        // MAP INIT
        var map = (self.map = L.map(self.el, {
            fullscreenControl: options.fullscreencontrol,
            zoomControl: options.zoomcontrol,
            // Leaflet.Sleep options
            sleep: true,
            sleepNote: false,
            hoverToWake: false,
            sleepOpacity: 1,
        }));

        var marker_cluster = (self.marker_cluster = new LMarkerClusterGroup({
            maxClusterRadius: self.options.maxClusterRadius,
        }));

        // hand over some map events to the element
        map.on("moveend zoomend", function (e) {
            self.$el.trigger("leaflet." + e.type, { original_event: e });
        });

        L.Icon.Default.imagePath = options.image_path;

        // Locatecontrol
        if (options.locatecontrol || options.autolocate) {
            var locatecontrol = L.control.locate().addTo(map);
            if (options.autolocate) {
                locatecontrol.start();
            }
        }

        // Layers
        // Must be an array
        if (Array.isArray(options.map_layers)) {
            var baseLayers = {};

            // Convert map_layers elements from string to objects, if necesarry
            options.map_layers = options.map_layers.map(function (it) {
                if (typeof it == "string") {
                    it = { id: it, title: it, options: {} };
                }
                return it;
            });
            for (var cnt = 0; cnt < options.map_layers.length; cnt++) {
                // build layers object with tileLayer instances
                var layer = options.map_layers[cnt];
                baseLayers[layer.title] = L.tileLayer.provider(layer.id, layer.options);
            }
            if (options.map_layers.length > 1) {
                L.control.layers(baseLayers).addTo(map);
            }
        }

        if (typeof options.default_map_layer == "string") {
            options.default_map_layer = { id: options.default_map_layer, options: {} };
        }
        L.tileLayer
            .provider(options.default_map_layer.id, options.default_map_layer.options)
            .addTo(map);

        map.setView([options.latitude, options.longitude], options.zoom);

        // ADD MARKERS
        var geojson = this.$el.data().geojson;

        if (typeof geojson === "string" && geojson.indexOf(".json") != -1) {
            // suppose this is a JSON url which ends with ".json" ... try to load it
            $.ajax({
                url: geojson,
                success: function (data) {
                    self.init_geojson(map, data);
                },
            });
        } else if (geojson) {
            // inject inline geoJSON data object
            self.init_geojson(map, geojson);
        }

        if (options.geosearch) {
            var provider;
            if (options.geosearch_provider === "esri") {
                provider = new EsriProvider();
            } else if (options.geosearch_provider === "google") {
                provider = new GoogleProvider();
            } else if (options.geosearch_provider === "bing") {
                provider = new BingProvider();
            } else {
                provider = new OpenStreetMapProvider();
            }

            // GEOSEARCH
            var geosearch = new GeoSearchControl({
                showMarker: main_marker === null,
                provider: provider,
            });
            map.addControl(geosearch);

            map.on("geosearch/showlocation", function (e) {
                var latlng = { lat: e.location.y, lng: e.location.x };
                if (main_marker && main_marker.feature.properties.editable) {
                    // update main_marker from geojson object
                    self.marker_cluster.removeLayer(main_marker);
                    main_marker.setLatLng(latlng).update();
                    self.marker_cluster.addLayer(main_marker);
                } else {
                    e.marker.setIcon(self.create_marker("red"));
                    self.bind_popup(
                        { properties: { editable: true, popup: e.location.label } },
                        e.marker
                    );
                    marker_cluster.addLayer(e.marker);
                }
                // fit to window
                map.fitBounds([latlng], fitBoundsOptions);
            });
        }

        if (options.addmarker) {
            var add_marker_callback = function (marker) {
                self.bind_popup({ properties: { editable: true } }, marker);
            };
            var addmarker = new L.Control.SimpleMarkers({
                delete_control: false,
                allow_popup: false,
                marker_icon: self.create_marker("red"),
                marker_draggable: true,
                add_marker_callback: add_marker_callback,
            });
            map.addControl(addmarker);
        }

        // Minimap
        if (options.minimap) {
            var minimap = new L.Control.MiniMap(
                L.tileLayer.provider(
                    options.default_map_layer.id,
                    options.default_map_layer.options
                ),
                { toggleDisplay: true, mapOptions: { sleep: false } }
            );
            map.addControl(minimap);
        }

        log.debug("pattern initialized");
    },

    init_geojson: function (map, geojson) {
        var self = this,
            bounds,
            marker_layer;
        marker_layer = L.geoJson(geojson, {
            pointToLayer: function (feature, latlng) {
                var extraClasses = feature.properties.extraClasses || "";
                var markerColor = "green";
                if (feature.properties.color) {
                    markerColor = feature.properties.color;
                } else if (!self.main_marker || feature.properties.main) {
                    markerColor = "red";
                }
                var marker_icon = self.create_marker(markerColor, extraClasses);
                var marker = new L.Marker(latlng, {
                    icon: marker_icon,
                    draggable: feature.properties.editable,
                });
                if (!self.main_marker || feature.properties.main) {
                    // Set main marker. This is the one, which is used
                    // for setting the search result marker.
                    self.main_marker = marker;
                }
                marker.on("dragend move", function (e) {
                    // UPDATE INPUTS ON MARKER MOVE
                    var latlng = e.target.getLatLng();
                    var $latinput = $(feature.properties.latinput);
                    var $lnginput = $(feature.properties.lnginput);
                    if ($latinput.length) {
                        $latinput.val(latlng.lat);
                    }
                    if ($lnginput.length) {
                        $lnginput.val(latlng.lng);
                    }
                });
                if (feature.properties.latinput) {
                    // UPDATE MARKER ON LATITUDE CHANGE
                    $(feature.properties.latinput).on("change", function (e) {
                        var latlng = marker.getLatLng();
                        self.marker_cluster.removeLayer(marker);
                        marker
                            .setLatLng({ lat: $(e.target).val(), lng: latlng.lng })
                            .update();
                        self.marker_cluster.addLayer(marker);
                        // fit bounds
                        bounds = self.marker_cluster.getBounds();
                        map.fitBounds(bounds, self.fitBoundsOptions);
                    });
                }
                if (feature.properties.lnginput) {
                    // UPDATE MARKER ON LONGITUDE CHANGE
                    $(feature.properties.lnginput).on("change", function (e) {
                        var latlng = marker.getLatLng();
                        self.marker_cluster.removeLayer(marker);
                        marker
                            .setLatLng({ lat: latlng.lat, lng: $(e.target).val() })
                            .update();
                        self.marker_cluster.addLayer(marker);
                        // fit bounds
                        bounds = self.marker_cluster.getBounds();
                        map.fitBounds(bounds, self.fitBoundsOptions);
                    });
                }
                return marker;
            },
            onEachFeature: self.bind_popup,
        });
        self.marker_cluster.addLayer(marker_layer);
        map.addLayer(self.marker_cluster);

        // autozoom
        bounds = self.marker_cluster.getBounds();
        map.fitBounds(bounds, self.fitBoundsOptions);
    },

    bind_popup: function (feature, marker) {
        var self = this,
            popup = feature.properties.popup;
        if (feature.properties.editable && !feature.properties.no_delete) {
            // for editable markers add "delete marker" link to popup
            popup = popup || "";
            var $popup = $("<div>" + popup + "</div><br/>");
            var $link = $("<a href='#' class='deleteMarker'>Delete Marker</a>");
            $link.on("click", function (e) {
                e.preventDefault();
                self.map.removeLayer(marker);
                marker = undefined;
            });
            marker.bindPopup($("<div/>").append($popup).append($link)[0]);
        } else if (popup) {
            marker.bindPopup(popup);
        }
    },

    create_marker: function (color, extraClasses) {
        color = color || "red";
        extraClasses = extraClasses || "";
        return L.AwesomeMarkers.icon({
            markerColor: color,
            prefix: "fa",
            icon: "circle",
            extraClasses: extraClasses,
        });
    },
});
