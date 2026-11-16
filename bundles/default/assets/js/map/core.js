
import * as maplibregl from "maplibregl";

let map = null;
let anchorsCollection = [];
let nextAnchorIterator = 0;

export function getContainer() {
    return document.getElementById("map");
}

export function getMap() {
    return map;
}

export function initMap(opts = {}) {
    map = new maplibregl.Map(opts);
    return map;
}

export function initAnchors(anchors) {
    anchorsCollection = anchors;

    map.addSource("shared-anchor-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
    });

    anchors.forEach((layerId) => {
        map.addLayer({
            id: "anchor-" + layerId,
            type: "line",
            source: "shared-anchor-source"
        });
    });
}

export function getNextLayerId(prefix) {
    return prefix + "-" + (nextAnchorIterator++);
}

export function addAnchoredLayer(component, anchor) {
    const idx = anchorsCollection.indexOf(anchor);
    const nextAnchor = idx === anchorsCollection.length - 1 ? null : anchorsCollection[idx + 1];
    const isObject = component.constructor === Object;

    if (nextAnchor) {
        if (isObject) map.addLayer(component, "anchor-" + nextAnchor);
        else component.addTo(map, "anchor-" + nextAnchor)
    } else {
        if (isObject) map.addLayer(component);
        else component.addTo(map);
    }
}

export function loadMapImage(opts) {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(img, 0, 0, size, size);

        if (opts.color) {
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = opts.color;
            ctx.fillRect(0, 0, size, size);
        }

        if (!map.hasImage(opts.id)) {
            map.addImage(opts.id, ctx.getImageData(0, 0, size, size));
        }
    };
    img.src = opts.url;
}

export function addMarker(o) {
    let marker = new maplibregl.Marker()
        .setLngLat([
            o.coordinate.lon,
            o.coordinate.lat
        ]);
    addAnchoredLayer(marker, "waypoint");
}
