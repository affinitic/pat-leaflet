import Pattern from "./leaflet";
import utils from "@patternslib/patternslib/src/core/utils";

describe("pat-leaflet", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("is initialized correctly", async () => {
        document.body.innerHTML = `<div class="pat-leaflet" />`;
        const el = document.querySelector(".pat-leaflet");

        // Just an example!
        // eslint-disable-next-line no-unused-vars
        const instance = new Pattern(el);
        await utils.timeout(1); // wait a tick for async to settle.

        expect(document.querySelector(".pat-leaflet.leaflet-container")).toBeTruthy();
        expect(document.querySelector(".pat-leaflet .leaflet-pane")).toBeTruthy();
        expect(document.querySelector(".pat-leaflet .leaflet-control-zoom-in")).toBeTruthy(); // prettier-ignore
        expect(document.querySelector(".pat-leaflet .leaflet-control-zoom-out")).toBeTruthy(); // prettier-ignore
        expect(document.querySelector(".pat-leaflet .leaflet-control-zoom-fullscreen")).toBeTruthy(); // prettier-ignore
    });
});
