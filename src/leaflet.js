import $ from "jquery";
import { BasePattern } from "@patternslib/patternslib/src/core/basepattern";
import Parser from "@patternslib/patternslib/src/core/parser";
import events from "@patternslib/patternslib/src/core/events";
import logging from "@patternslib/patternslib/src/core/logging";
import registry from "@patternslib/patternslib/src/core/registry";

const log = logging.getLogger("pat-leaflet");
log.debug("pattern loaded");

export const parser = new Parser("leaflet");

// TODO: Follow Patternslib conventions and rename to NAME-SUBNAME-SUBSUBNAME style names.
parser.addArgument("latitude", "0.0");
parser.addArgument("longitude", "0.0");
parser.addArgument("zoom", "auto");

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

// fetch geojson data via AJAX url
parser.addArgument("geojson_ajaxurl", "");

class Pattern extends BasePattern {
    static name = "leaflet";
    static trigger = ".pat-leaflet";
    static parser = parser;
    map = null;

    async init() {
        import("./leaflet.scss");

        this.L = (await import("leaflet")).default;
        const LMarkerClusterGroup = (await import("leaflet.markercluster")).MarkerClusterGroup; // prettier-ignore

        await import("leaflet-providers");
        await import("leaflet-sleep");
        await import("leaflet.awesome-markers");
        await import("leaflet.fullscreen");

        const options = (this.options = parser.parse(this.el));

        const fitBoundsOptions = (this.fitBoundsOptions = {
            maxZoom: options.zoom,
            padding: [parseInt(options.boundsPadding), parseInt(options.boundsPadding)],
        });

        this.main_marker = null;

        // MAP INIT
        const map = (this.map = this.L.map(this.el, {
            fullscreenControl: options.fullscreencontrol,
            zoomControl: options.zoomcontrol,
            // Leaflet.Sleep options
            sleep: true,
            sleepNote: false,
            hoverToWake: false,
            sleepOpacity: 1,
        }));

        const marker_cluster = (this.marker_cluster = new LMarkerClusterGroup({
            maxClusterRadius: this.options.maxClusterRadius,
        }));

        // hand over some map events to the element
        map.on("moveend zoomend", (e) => {
            // TODO: Change to native event for next major version.
            $(this.el).trigger(`leaflet.${e.type}`, { original_event: e });
        });

        this.L.Icon.Default.imagePath = options.image_path;

        // Locatecontrol
        if (options.locatecontrol || options.autolocate) {
            await import("leaflet.locatecontrol");
            const locatecontrol = this.L.control.locate().addTo(map);
            if (options.autolocate) {
                locatecontrol.start();
            }
        }

        // Layers
        // Must be an array
        if (Array.isArray(options.map_layers)) {
            const baseLayers = {};

            // Convert map_layers elements from string to objects, if necesarry
            options.map_layers = options.map_layers.map(function (it) {
                if (typeof it == "string") {
                    it = { id: it, title: it, options: {} };
                }
                return it;
            });
            for (const layer of options.map_layers) {
                // build layers object with tileLayer instances
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
        if (options.zoom === "auto") {
            map.setView([options.latitude, options.longitude], 14);
        } else {
            map.setView([options.latitude, options.longitude], options.zoom);
        }

        // ADD MARKERS
        if (options.geojson_ajaxurl !== "") {
            let response;
            try {
                response = await fetch(options.geojson_ajaxurl);
                const data = await response.json();
                this.init_geojson(map, data);
            } catch (e) {
                log.info(
                    `Could not load geojson data from url ${options.geojson_ajaxurl}`
                );
                return;
            }
        } else if (this.el.dataset.geojson) {
            try {
                // inject inline geoJSON data object
                this.init_geojson(map, JSON.parse(this.el.dataset.geojson));
            } catch (e) {
                log.info("Could not parse geojson data.");
                return;
            }
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
            const geosearch = new GeoSearchControl({
                showMarker: this.main_marker === null,
                provider: new SearchProvider(),
            });
            map.addControl(geosearch);

            map.on("geosearch/showlocation", (e) => {
                const latlng = { lat: e.location.y, lng: e.location.x };
                if (this.main_marker && this.main_marker.feature.properties.editable) {
                    // update main_marker from geojson object
                    this.marker_cluster.removeLayer(this.main_marker);
                    this.main_marker.setLatLng(latlng).update();
                    this.marker_cluster.addLayer(this.main_marker);
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

            const add_marker_callback = function (marker) {
                this.bind_popup({ properties: { editable: true } }, marker);
            };
            const addmarker = new this.L.Control.SimpleMarkers({
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

        // Trigger the open of a given popup id
        $(this.el).on("leaflet.openPopup", (e, id) => {
            var markers = [];
            if ( typeof this.marker_cluster != "undefined" ) {
                map.eachLayer((l) => {
                    if(l instanceof this.L.Marker) {
                        markers.push(l);
                    }
                });
                if (id <= markers.length - 1) {
                    markers[id].openPopup();
                }
            }
        });

        // Trigger the open of a given popup id
        $(this.el).on("leaflet.closePopup", (e, id) => {
            var markers = [];
            if ( typeof this.marker_cluster != "undefined" ) {
                map.eachLayer((l) => {
                    if(l instanceof this.L.Marker) {
                        markers.push(l);
                    }
                });
                if (id <= markers.length - 1) {
                    markers[id].closePopup();
                }
            }
        });
        log.debug("pattern initialized");
    }

    init_geojson(map, geojson) {
        let bounds;
        const marker_layer = this.L.geoJson(geojson, {
            pointToLayer: (feature, latlng) => {
                const extraClasses = feature.properties.extraClasses || "";
                let markerColor = "green";
                if (feature.properties.color) {
                    markerColor = feature.properties.color;
                } else if (!this.main_marker || feature.properties.main) {
                    markerColor = "red";
                }
                const marker_icon = this.create_marker(markerColor, extraClasses);
                const marker = new this.L.Marker(latlng, {
                    icon: marker_icon,
                    draggable: feature.properties.editable,
                });
                if (!this.main_marker || feature.properties.main) {
                    // Set main marker. This is the one, which is used
                    // for setting the search result marker.
                    this.main_marker = marker;
                }

                const input_lat = document.querySelector(feature.properties.latinput);
                const input_lng = document.querySelector(feature.properties.lnginput);

                marker.on("dragend move", (e) => {
                    // UPDATE INPUTS ON MARKER MOVE
                    const latlng = e.target.getLatLng();
                    if (input_lat) {
                        input_lat.value = latlng.lat;
                    }
                    if (input_lng) {
                        input_lng.value = latlng.lng;
                    }
                });
                if (input_lat) {
                    // UPDATE MARKER ON LATITUDE CHANGE
                    events.add_event_listener(
                        input_lat,
                        "input",
                        "pat-leaflet--input_lat",
                        (e) => {
                            const latlng = marker.getLatLng();
                            this.marker_cluster.removeLayer(marker);
                            marker
                                .setLatLng({ lat: e.target.value, lng: latlng.lng })
                                .update();
                            this.marker_cluster.addLayer(marker);
                            // fit bounds
                            bounds = this.marker_cluster.getBounds();
                            map.fitBounds(bounds, this.fitBoundsOptions);
                        }
                    );
                }
                if (input_lng) {
                    // UPDATE MARKER ON LONGITUDE CHANGE
                    events.add_event_listener(
                        input_lng,
                        "input",
                        "pat-leaflet--input_lng",
                        (e) => {
                            const latlng = marker.getLatLng();
                            this.marker_cluster.removeLayer(marker);
                            marker
                                .setLatLng({ lat: latlng.lat, lng: e.target.value })
                                .update();
                            this.marker_cluster.addLayer(marker);
                            // fit bounds
                            bounds = this.marker_cluster.getBounds();
                            map.fitBounds(bounds, this.fitBoundsOptions);
                        }
                    );
                }
                return marker;
            },
            onEachFeature: this.bind_popup.bind(this),
        });
        this.marker_cluster.addLayer(marker_layer);
        map.addLayer(this.marker_cluster);

        // autozoom
        if (this.options.zoom === "auto") {
            bounds = this.marker_cluster.getBounds();
            map.fitBounds(bounds, this.fitBoundsOptions);
        }
        
    }

    bind_popup(feature, marker) {
        const popup = feature.properties.popup || "";
        if (feature.properties.editable && !feature.properties.no_delete) {
            // for editable markers add "delete marker" link to popup
            const popup_el = document.createElement("div");
            popup_el.innerHTML = `
              <div>${popup}</div>
              <br/>
              <button type="button" class="delete-marker">Delete marker</button>
            `;

            // delete marker
            popup_el.querySelector(".delete-marker").addEventListener("click", (e) => {
                e.preventDefault();
                this.map.removeLayer(marker);
                marker = undefined;
            });
            marker.bindPopup(popup_el);
        } else if (popup) {
            marker.bindPopup(popup);
        }
    }

    create_marker(color, extraClasses) {
        color = color || "red";
        extraClasses = extraClasses || "";
        return this.L.AwesomeMarkers.icon({
            markerColor: color,
            prefix: "fa",
            icon: "circle",
            extraClasses: extraClasses,
        });
    }
}

registry.register(Pattern);

export default Pattern;
export { Pattern };
