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

        this.L = (await import("leaflet")).default;
        const LMarkerClusterGroup = (await import("leaflet.markercluster")).MarkerClusterGroup; // prettier-ignore

        await import("leaflet-providers");
        await import("leaflet-sleep");
        await import("leaflet.awesome-markers");
        await import("leaflet.fullscreen");

        const options = (this.options = parser.parse(this.el));

        var fitBoundsOptions = (this.fitBoundsOptions = {
            maxZoom: options.zoom,
            padding: [parseInt(options.boundsPadding), parseInt(options.boundsPadding)],
        });

        var main_marker = (this.main_marker = null);

        // MAP INIT
        var map = (this.map = this.L.map(this.el, {
            fullscreenControl: options.fullscreencontrol,
            zoomControl: options.zoomcontrol,
            // Leaflet.Sleep options
            sleep: true,
            sleepNote: false,
            hoverToWake: false,
            sleepOpacity: 1,
        }));

        var marker_cluster = (this.marker_cluster = new LMarkerClusterGroup({
            maxClusterRadius: this.options.maxClusterRadius,
        }));

        // hand over some map events to the element
        map.on("moveend zoomend", (e) => {
            this.$el.trigger(`leaflet.${e.type}`, { original_event: e });
        });

        this.L.Icon.Default.imagePath = options.image_path;

        // Locatecontrol
        if (options.locatecontrol || options.autolocate) {
            await import("leaflet.locatecontrol");
            var locatecontrol = this.L.control.locate().addTo(map);
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
                baseLayers[layer.title] = this.L.tileLayer.provider(
                    layer.id,
                    layer.options
                );
            }
            if (options.map_layers.length > 1) {
                this.L.control.layers(baseLayers).addTo(map);
            }
        }

        if (typeof options.default_map_layer == "string") {
            options.default_map_layer = { id: options.default_map_layer, options: {} };
        }
        this.L.tileLayer
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
                    this.init_geojson(map, data);
                },
            });
        } else if (geojson) {
            // inject inline geoJSON data object
            this.init_geojson(map, geojson);
        }

        if (options.geosearch) {
            const { GeoSearchControl } = await import("leaflet-geosearch");

            let SearchProvider;
            if (options.geosearch_provider === "esri") {
                SearchProvider = (await import("leaflet-geosearch")).EsriProvider;
            } else if (options.geosearch_provider === "google") {
                SearchProvider = (await import("leaflet-geosearch")).GoogleProvider;
            } else if (options.geosearch_provider === "bing") {
                SearchProvider = (await import("leaflet-geosearch")).BingProvider;
            } else {
                SearchProvider = (await import("leaflet-geosearch")).OpenStreetMapProvider; // prettier-ignore
            }

            // GEOSEARCH
            var geosearch = new GeoSearchControl({
                showMarker: main_marker === null,
                provider: new SearchProvider(),
            });
            map.addControl(geosearch);

            map.on("geosearch/showlocation", (e) => {
                var latlng = { lat: e.location.y, lng: e.location.x };
                if (main_marker && main_marker.feature.properties.editable) {
                    // update main_marker from geojson object
                    this.marker_cluster.removeLayer(main_marker);
                    main_marker.setLatLng(latlng).update();
                    this.marker_cluster.addLayer(main_marker);
                } else {
                    e.marker.setIcon(this.create_marker("red"));
                    this.bind_popup(
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
            await import("leaflet.simplemarkers/lib/Control.SimpleMarkers");

            var add_marker_callback = function (marker) {
                this.bind_popup({ properties: { editable: true } }, marker);
            };
            var addmarker = new this.L.Control.SimpleMarkers({
                delete_control: false,
                allow_popup: false,
                marker_icon: this.create_marker("red"),
                marker_draggable: true,
                add_marker_callback: add_marker_callback.bind(this),
            });
            map.addControl(addmarker);
        }

        // Minimap
        if (options.minimap) {
            await import("leaflet-minimap");
            const minimap = new this.L.Control.MiniMap(
                this.L.tileLayer.provider(
                    options.default_map_layer.id,
                    options.default_map_layer.options
                ),
                { toggleDisplay: true, mapOptions: { sleep: false } }
            );
            map.addControl(minimap);
        }

        log.debug("pattern initialized");
    },

    init_geojson(map, geojson) {
        let bounds;
        const marker_layer = this.L.geoJson(geojson, {
            pointToLayer: (feature, latlng) => {
                var extraClasses = feature.properties.extraClasses || "";
                var markerColor = "green";
                if (feature.properties.color) {
                    markerColor = feature.properties.color;
                } else if (!this.main_marker || feature.properties.main) {
                    markerColor = "red";
                }
                var marker_icon = this.create_marker(markerColor, extraClasses);
                var marker = new this.L.Marker(latlng, {
                    icon: marker_icon,
                    draggable: feature.properties.editable,
                });
                if (!this.main_marker || feature.properties.main) {
                    // Set main marker. This is the one, which is used
                    // for setting the search result marker.
                    this.main_marker = marker;
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
                        this.marker_cluster.removeLayer(marker);
                        marker
                            .setLatLng({ lat: $(e.target).val(), lng: latlng.lng })
                            .update();
                        this.marker_cluster.addLayer(marker);
                        // fit bounds
                        bounds = this.marker_cluster.getBounds();
                        map.fitBounds(bounds, this.fitBoundsOptions);
                    });
                }
                if (feature.properties.lnginput) {
                    // UPDATE MARKER ON LONGITUDE CHANGE
                    $(feature.properties.lnginput).on("change", function (e) {
                        var latlng = marker.getLatLng();
                        this.marker_cluster.removeLayer(marker);
                        marker
                            .setLatLng({ lat: latlng.lat, lng: $(e.target).val() })
                            .update();
                        this.marker_cluster.addLayer(marker);
                        // fit bounds
                        bounds = this.marker_cluster.getBounds();
                        map.fitBounds(bounds, this.fitBoundsOptions);
                    });
                }
                return marker;
            },
            onEachFeature: this.bind_popup.bind(this),
        });
        this.marker_cluster.addLayer(marker_layer);
        map.addLayer(this.marker_cluster);

        // autozoom
        bounds = this.marker_cluster.getBounds();
        map.fitBounds(bounds, this.fitBoundsOptions);
    },

    bind_popup(feature, marker) {
        let popup = feature.properties.popup;
        if (feature.properties.editable && !feature.properties.no_delete) {
            // for editable markers add "delete marker" link to popup
            popup = popup || "";
            var $popup = $("<div>" + popup + "</div><br/>");
            var $link = $("<a href='#' class='deleteMarker'>Delete Marker</a>");
            $link.on("click", (e) => {
                e.preventDefault();
                this.map.removeLayer(marker);
                marker = undefined;
            });
            marker.bindPopup($("<div/>").append($popup).append($link)[0]);
        } else if (popup) {
            marker.bindPopup(popup);
        }
    },

    create_marker(color, extraClasses) {
        color = color || "red";
        extraClasses = extraClasses || "";
        return this.L.AwesomeMarkers.icon({
            markerColor: color,
            prefix: "fa",
            icon: "circle",
            extraClasses: extraClasses,
        });
    },
});
