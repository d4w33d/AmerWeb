
import * as mapcore from "map/core.js";
import * as maprender from "map/renderers.js";
import * as nav from "map/nav.js";
import * as ui from "map/ui.js";

const opts = "MapOptions" in window ? MapOptions : {};

ui.ready(() => {

    ui.init();
    nav.initNavFromOptions(opts);

    const map = mapcore.initMap({
        container:          mapcore.getContainer().id,
        style:              "https://tiles.openwaters.io/seamap/style.json",
        center:             nav.getInitialMapCenter(),
        zoom:               nav.getInitialMapZoom(),
        attributionControl: false,
    });

    map.on("load", () => {

        mapcore.initAnchors([
            "polygon",
            "multi-segment-line",
            "door",
            "track",
            "route",
            "textLabel",
            "waypoint",
        ]);

        map.on("dragend", (e) => {
            nav.updateMapStatus(opts);
            nav.updateUrl();
        });

        map.on("zoomend", (e) => {
            nav.updateMapStatus(opts);
            nav.updateUrl();
        });

        map.on("styleimagemissing", (e) => {
            const id = e.id;
            if (map.hasImage(id)) return;

            const m = /^(.+)_([0-9a-f]{6})$/.exec(id);
            if (m) {
                mapcore.loadMapImage({
                    id: id,
                    url: `/bundles/default/assets/img/map/markers/${m[1]}.svg`,
                    color: id.startsWith("z_") ? null : ("#" + m[2]),
                });
            }
        });

        if (opts.map_data) {
            opts.map_data.elements.forEach((elem) => maprender.renderMapElement(elem.type, elem));
            ui.showMapInfo(opts.map_data);
        }

        if (opts.waypoint) {
            mapcore.addMarker({ coordinate: opts.waypoint.coordinate });
        }

    });

});