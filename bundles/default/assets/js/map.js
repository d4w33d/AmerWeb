
import * as maplibregl from 'https://unpkg.com/maplibre-gl@^6.17.0/dist/maplibre-gl.mjs';

const o = MapOptions;

function updateUrl() {
    const url = window.location.pathname;
    const qs = [];
    for (let k in s) qs.push(k + (s[k] === true ? "" : ("=" + encodeURIComponent(s[k]))));
    history.pushState({}, "", url + (qs.length > 0 ? "?" + qs.join("&") : ""));
}

function updateMapStatus() {
    let { lng, lat } = map.getCenter();
    const zoom = map.getZoom();

    s.c = roundCoordinate(lat) + "," + roundCoordinate(lng);

    if (!(o.waypoint && zoom == o.defaults.waypointZoom) || !(!o.waypoint && zoom === o.defaults.zoom)) {
        s.z = roundZoom(zoom);
    } else if (s.hasOwnProperty("z")) {
        delete s.z;
    }
}

function roundCoordinate(coord) { return Math.round(coord * 1000000) / 1000000; }
function roundZoom(zoom) { return Math.round(zoom * 100) / 100; }

function addLayer(component, anchor) {
    const idx = anchors.indexOf(anchor);
    const nextAnchor = idx === anchors.length - 1 ? null : anchors[idx + 1];
    const isObject = component.constructor === Object;

    if (nextAnchor) {
        if (isObject) map.addLayer(component, "anchor-" + nextAnchor);
        else component.addTo(map, "anchor-" + nextAnchor)
    } else {
        if (isObject) map.addLayer(component);
        else component.addTo(map);
    }
}



const getInitialViewFromBounds = (lat1, lat2, lon1, lon2, width, height, padding = 0) => {
    const minLat = Math.min(lat1, lat2);
    const maxLat = Math.max(lat1, lat2);
    const minLon = Math.min(lon1, lon2);
    const maxLon = Math.max(lon1, lon2);

    const center = [
        (minLon + maxLon) / 2,
        (minLat + maxLat) / 2
    ];

    const availWidth = width - (padding * 2);
    const availHeight = height - (padding * 2);

    const rad = Math.PI / 180;
    const sin1 = Math.sin(minLat * rad);
    const sin2 = Math.sin(maxLat * rad);

    const y1 = 0.5 - Math.log((1 + sin1) / (1 - sin1)) / (4 * Math.PI);
    const y2 = 0.5 - Math.log((1 + sin2) / (1 - sin2)) / (4 * Math.PI);

    const dy = Math.abs(y2 - y1);
    const dx = (maxLon - minLon) / 360;

    const zoomX = Math.log2(availWidth / (dx * 256));
    const zoomY = Math.log2(availHeight / (dy * 256));
    const zoom = Math.min(zoomX, zoomY);

    return { center, zoom };
};


let idIterator = 0;
const nextId = (prefix) => {
    return prefix + "-" + (idIterator++);
};

const anchors = [
    "polygon",
    "multi-segment-line",
    "door",
    "track",
    "route",
    "textLabel",
    "waypoint",
];

const s = {};
if (o.waypoint) s.q = o.waypoint.lat + "," + o.waypoint.lon;
if (o.queried.center) s.c = o.queried.center.lat + "," + o.queried.center.lon;
if (o.queried.zoom) s.z = o.queried.zoom;

let mapCenter = [ o.defaults.center.lon, o.defaults.center.lat ];
let mapZoom = o.defaults.zoom;

if (o.queried.center) mapCenter = [ o.queried.center.lon, o.queried.center.lat ];
else if (o.waypoint) mapCenter = [ o.waypoint.coordinate.lon, o.waypoint.coordinate.lat ];

if (o.queried.zoom) mapZoom = o.queried.zoom;
else if (o.waypoint) mapZoom = o.defaults.waypointZoom;




if (o.map_data && o.queried.center === null) {

    const bounds = { lat1: null, lat2: null, lon1: null, lon2: null };
    const addBound = (type, val) => {
        bounds[type + "1"] = bounds[type + "1"] == null ? val : Math.min(bounds[type + "1"], val);
        bounds[type + "2"] = bounds[type + "2"] == null ? val : Math.max(bounds[type + "2"], val);
    };

    const addBounds = (point) => {
        addBound("lat", point.lat);
        addBound("lon", point.lon);
    };


    o.map_data.elements.forEach((elem) => {
        elem.data.points?.forEach((point) => addBounds(point));
        if (elem.data.hasOwnProperty("point")) addBounds(elem.data.point);
        if (elem.data.hasOwnProperty("p1")) addBounds(elem.data.p1);
        if (elem.data.hasOwnProperty("p2")) addBounds(elem.data.p2);
    });

    const width = window.innerWidth;
    const height = window.innerHeight;
    const { center, zoom } = getInitialViewFromBounds(
        bounds.lat1,
        bounds.lat2,
        bounds.lon1,
        bounds.lon2,
        width,
        height,
        Math.round(width * 0.2)
    );

    mapCenter = center;
    mapZoom = zoom;

}

const map = new maplibregl.Map({
    container: "map",
    style:     "https://tiles.openwaters.io/seamap/style.json",
    center:    mapCenter,
    zoom:      mapZoom,
});

map.on("load", () => {

    map.on("dragend", (e) => {
        updateMapStatus();
        updateUrl();
    });

    map.on("zoomend", (e) => {
        updateMapStatus();
        updateUrl();
    });

    map.on("styleimagemissing", (e) => {
        const id = e.id;
        if (map.hasImage(id)) return;

        const lastUnderscore = id.lastIndexOf('_');
        const iconName = id.substring(0, lastUnderscore);
        const colorHex = "#" + id.substring(lastUnderscore + 1);

        const url = `/bundles/default/assets/img/map/markers/${iconName}.svg`;
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const size = 32;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(img, 0, 0, size, size);

            if (!iconName.startsWith("z_")) {
                ctx.globalCompositeOperation = "source-in";
                ctx.fillStyle = colorHex;
                ctx.fillRect(0, 0, size, size);
            }

            if (!map.hasImage(id)) {
                map.addImage(id, ctx.getImageData(0, 0, size, size));
            }
        };
        img.src = url;
    });

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

    // =========================================================================

    if (o.map_data) {
        o.map_data.elements.forEach((elem) => {
            if (ElementRenderer.hasOwnProperty(elem.type)) {
                ElementRenderer[elem.type].render(elem, map);
            }
        });
    }

    if (o.waypoint) {
        let marker = new maplibregl.Marker()
            .setLngLat([ o.waypoint.coordinate.lon, o.waypoint.coordinate.lat ]);
        addLayer(marker, "waypoint");
    }

});

const getCoords = (pt) => {
    if (!pt) return [0, 0];
    const lon = pt.lon ?? pt.longitude ?? 0;
    const lat = pt.lat ?? pt.latitude ?? 0;
    return [lon, lat];
};

const calculateDistanceNM = (p1, p2) => {
    const R = 3440.065;
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLon = (p2[0] - p1[0]) * Math.PI / 180;
    const lat1 = p1[1] * Math.PI / 180;
    const lat2 = p2[1] * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const calculateBearing = (p1, p2) => {
    const lon1 = p1[0] * Math.PI / 180;
    const lon2 = p2[0] * Math.PI / 180;
    const lat1 = p1[1] * Math.PI / 180;
    const lat2 = p2[1] * Math.PI / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
};

const formatDistance = (distNM) => {
    return distNM < 1 ? `${(distNM * 1000).toFixed(0)}m` : `${distNM.toFixed(1)}NM`;
};

const createTextBadgeImage = (text, drawingColor, flipArrow = false) => {
    const fontSize = 12;
    const font = "bold " + fontSize + "px sans-serif";
    const paddingH = 10;
    const paddingV = 7;
    const height = 25;
    const arrowWidth = 7;
    const arrowH = 7;
    const r = 5;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);

    const textWidth = Math.ceil(metrics.width);
    const rectWidth = textWidth + paddingH * 2;
    const totalWidth = rectWidth + arrowWidth;

    canvas.width = totalWidth;
    canvas.height = height;

    ctx.font = font;
    ctx.textBaseline = 'middle';

    // Fond blanc
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    const midY = height / 2;

    if (!flipArrow) {
        ctx.moveTo(r, 0);
        ctx.lineTo(rectWidth - r, 0);
        ctx.quadraticCurveTo(rectWidth, 0, rectWidth, r);
        ctx.lineTo(rectWidth, midY - arrowH);
        ctx.lineTo(rectWidth + arrowWidth, midY);
        ctx.lineTo(rectWidth, midY + arrowH);
        ctx.lineTo(rectWidth, height - r);
        ctx.quadraticCurveTo(rectWidth, height, rectWidth - r, height);
        ctx.lineTo(r, height);
        ctx.quadraticCurveTo(0, height, 0, height - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
    } else {
        ctx.moveTo(arrowWidth + r, 0);
        ctx.lineTo(totalWidth - r, 0);
        ctx.quadraticCurveTo(totalWidth, 0, totalWidth, r);
        ctx.lineTo(totalWidth, height - r);
        ctx.quadraticCurveTo(totalWidth, height, totalWidth - r, height);
        ctx.lineTo(arrowWidth + r, height);
        ctx.quadraticCurveTo(arrowWidth, height, arrowWidth, height - r);
        ctx.lineTo(arrowWidth, midY + arrowH);
        ctx.lineTo(0, midY);
        ctx.lineTo(arrowWidth, midY - arrowH);
        ctx.lineTo(arrowWidth, r);
        ctx.quadraticCurveTo(arrowWidth, 0, arrowWidth + r, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Texte
    ctx.fillStyle = drawingColor;
    const textX = flipArrow ? arrowWidth + paddingH : paddingH;
    ctx.fillText(text, textX, midY + 2);

    return ctx.getImageData(0, 0, totalWidth, height);
};

// Génération dynamique du cartouche pour les TextLabels
const createLabelBitmapImage = (text) => {
    const fontSize = 12;
    const paddingH = 10;
    const paddingV = 7;
    const font = "bold " + fontSize + "px sans-serif";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    const metrics = ctx.measureText(text);

    const textWidth = Math.ceil(metrics.width);
    const height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + paddingV * 2) || 42;
    const width = textWidth + paddingH * 2;

    canvas.width = width + 8;
    canvas.height = height + 8;

    ctx.font = font;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    const r = 5;
    const m = 4;
    ctx.beginPath();
    ctx.roundRect(m, m, width, height, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, m + paddingH, (m + height / 2) + 1);

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const ElementRenderer = {
    Route: {
        render(elem, map) {
            const baseId = elem.id || nextId("route");
            const sourceId = `source_route_${baseId}`;
            const textSourceId = `source_route_text_${baseId}`;
            const outlineLayerId = `outline_route_${baseId}`;
            const lineLayerId = `layer_route_${baseId}`;
            const textLayerId = `layer_route_text_${baseId}`;

            const points = (elem.data.points || []).map(getCoords);
            if (points.length < 2) return;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: points }
                    }
                });
            }

            if (!map.getSource(textSourceId)) {
                map.addSource(textSourceId, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
            }

            // Bord blanc (outline)
            if (!map.getLayer(outlineLayerId)) {
                map.addLayer({
                    id: outlineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#FFFFFF", "line-width": 5.5 }
                }, "anchor-route");
            }

            // Trait cœur vert (#6CBB02)
            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#6CBB02", "line-width": 3 }
                }, "anchor-route");
            }

            // Cartouches de distances et directions par segment
            if (!map.getLayer(textLayerId)) {
                map.addLayer({
                    id: textLayerId,
                    type: "symbol",
                    source: textSourceId,
                    layout: {
                        "icon-image": "{icon_id}",
                        "icon-rotate": ["get", "rotation"],
                        "icon-rotation-alignment": "map",
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true
                    }
                }, "anchor-route");
            }

            // Calcul et enregistrement des badges de segments
            const textFeatures = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const dist = calculateDistanceNM(p1, p2);
                const bearing = Math.round(calculateBearing(p1, p2));
                const midLon = (p1[0] + p2[0]) / 2;
                const midLat = (p1[1] + p2[1]) / 2;
                const isLeft = p2[0] < p1[0];

                let angle = bearing - 90;
                while (angle <= -90) angle += 180;
                while (angle > 90) angle -= 180;

                const labelText = `${formatDistance(dist)} ${bearing}°`;
                const imageId = `badge_${baseId}_${i}_${bearing}_${isLeft}`;

                if (!map.hasImage(imageId)) {
                    const imgData = createTextBadgeImage(labelText, "#6CBB02", isLeft);
                    map.addImage(imageId, imgData);
                }

                textFeatures.push({
                    type: "Feature",
                    properties: { icon_id: imageId, rotation: angle },
                    geometry: { type: "Point", coordinates: [midLon, midLat] }
                });
            }

            map.getSource(textSourceId).setData({
                type: "FeatureCollection",
                features: textFeatures
            });
        }
    },

    Waypoint: {
        render(elem, map) {
            const baseId = elem.id || nextId("waypoint");
            const sourceId = `source_waypoint_${baseId}`;
            const layerId = `layer_waypoint_${baseId}`;
            const [lon, lat] = getCoords(elem.data.point);

            const iconName = elem.data.symbolIcon || "a_00_default";
            const colorHex = (elem.data.symbolColor || "#109DD3").replace('#', '');
            const imageKey = `${iconName}_${colorHex}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        properties: { name: elem.data.name, isMob: elem.data.isMob || false },
                        geometry: { type: "Point", coordinates: [lon, lat] }
                    }
                });
            }

            if (!map.getLayer(layerId)) {
                map.addLayer({
                    id: layerId,
                    type: "symbol",
                    source: sourceId,
                    layout: {
                        "icon-image": imageKey,
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true,
                        "icon-anchor": "bottom",
                        "icon-size": elem.data.isMob ? 1.8 : 1.3
                    }
                }, "anchor-waypoint");
            }
        }
    },

    MultiSegmentLine: {
        render(elem, map) {
            const baseId = elem.id || nextId("line");
            const sourceId = `source_line_${baseId}`;
            const haloLayerId = `halo_line_${baseId}`;
            const lineLayerId = `layer_line_${baseId}`;
            const points = (elem.data.points || []).map(getCoords);

            const strokeWidths = { thin: 3, medium: 6, thick: 9 };
            const width = strokeWidths[elem.data.strokeWidth] || 6;
            const color = elem.data.colorHex || "#3388FF";

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: { type: "Feature", geometry: { type: "LineString", coordinates: points } }
                });
            }

            // Halo / Contour de la ligne
            if (!map.getLayer(haloLayerId)) {
                map.addLayer({
                    id: haloLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": color,
                        "line-width": width + 6,
                        "line-opacity": 0.2
                    }
                }, "anchor-multi-segment-line");
            }

            // Ligne principale
            if (!map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": color,
                        "line-width": width
                    }
                }, "anchor-multi-segment-line");
            }
        }
    },

    Polygon: {
        render(elem, map) {
            const baseId = elem.id || nextId("polygon");
            const sourceId = `source_polygon_${baseId}`;
            const fillLayerId = `layer_polygon_fill_${baseId}`;
            const lineLayerId = `layer_polygon_line_${baseId}`;

            let rawPoints = (elem.data.points || []).map(getCoords);
            if (rawPoints.length >= 3) {
                const first = rawPoints[0];
                const last = rawPoints[rawPoints.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    rawPoints.push(first);
                }
            }

            const color = elem.data.colorHex || "#3388FF";
            const strokeWidths = { none: 0, thin: 2, medium: 4, thick: 6 };
            const strokePx = strokeWidths[elem.data.strokeWidth] ?? 4;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: {
                            type: rawPoints.length >= 3 ? "Polygon" : "LineString",
                            coordinates: rawPoints.length >= 3 ? [rawPoints] : rawPoints
                        }
                    }
                });
            }

            if (rawPoints.length >= 3 && !map.getLayer(fillLayerId)) {
                map.addLayer({
                    id: fillLayerId,
                    type: "fill",
                    source: sourceId,
                    paint: { "fill-color": color, "fill-opacity": 0.6 }
                }, "anchor-polygon");
            }

            if (strokePx > 0 && !map.getLayer(lineLayerId)) {
                map.addLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": color, "line-width": strokePx }
                }, "anchor-polygon");
            }
        }
    },

    TextLabel: {
        render(elem, map) {
            const baseId = elem.id || nextId("label");
            const sourceId = `source_label_${baseId}`;
            const layerId = `layer_label_${baseId}`;
            const [lon, lat] = getCoords(elem.data.point);
            const text = elem.data.text || "";
            const imageId = `text_label_img_${baseId}_${text.length}`;

            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: { type: "Point", coordinates: [lon, lat] }
                    }
                });
            }

            if (!map.hasImage(imageId)) {
                const imgData = createLabelBitmapImage(text);
                map.addImage(imageId, imgData);
            }

            if (!map.getLayer(layerId)) {
                map.addLayer({
                    id: layerId,
                    type: "symbol",
                    source: sourceId,
                    layout: {
                        "icon-image": imageId,
                        "icon-anchor": "center",
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true
                    }
                }, "anchor-textLabel");
            }
        }
    },

    Door: {
        render(elem, map) {
            const baseId = elem.id || nextId("door");
            const lineSourceId = `source_door_line_${baseId}`;
            const pointsSourceId = `source_door_points_${baseId}`;
            const haloLayerId = `layer_door_halo_${baseId}`;
            const bgLayerId = `layer_door_bg_${baseId}`;
            const mainLayerId = `layer_door_main_${baseId}`;
            const pointsLayerId = `layer_door_points_${baseId}`;

            const p1 = getCoords(elem.data.p1);
            const p2 = getCoords(elem.data.p2);

            const colors = {
                START_LINE: "#00C853",
                FINISH_LINE: "#D50000",
                GATE: "#000000",
                TRANSIT: "#00C853",
                OBSTRUCTION: "#D50000"
            };
            const primaryColor = colors[elem.data.doorType] || "#000000";
            const doorType = elem.data.doorType;

            if (!map.getSource(lineSourceId)) {
                map.addSource(lineSourceId, {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        geometry: { type: "LineString", coordinates: [p1, p2] }
                    }
                });
            }

            if (!map.getSource(pointsSourceId)) {
                map.addSource(pointsSourceId, {
                    type: "geojson",
                    data: {
                        type: "FeatureCollection",
                        features: [
                            { type: "Feature", geometry: { type: "Point", coordinates: p1 } },
                            { type: "Feature", geometry: { type: "Point", coordinates: p2 } }
                        ]
                    }
                });
            }

            // Nettoyage des calques existants pour éviter les doublons lors des re-rendus
            [haloLayerId, bgLayerId, mainLayerId, pointsLayerId].forEach(id => {
                if (map.getLayer(id)) map.removeLayer(id);
            });

            // Halo de porte
            map.addLayer({
                id: haloLayerId,
                type: "line",
                source: lineSourceId,
                layout: { "line-cap": "round" },
                paint: {
                    "line-color": primaryColor,
                    "line-width": 10,
                    "line-opacity": 0.25
                }
            }, "anchor-door");

            if (doorType === "START_LINE" || doorType === "FINISH_LINE") {
                map.addLayer({
                    id: bgLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: { "line-color": "#FFFFFF", "line-width": 5 }
                }, "anchor-door");

                map.addLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": primaryColor,
                        "line-width": 3,
                        "line-dasharray": [0.5, 1.25]
                    }
                }, "anchor-door");
            } else if (doorType === "GATE") {
                map.addLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": primaryColor,
                        "line-width": 4,
                        "line-dasharray": [2, 1.5, 0.1, 1.5]
                    }
                }, "anchor-door");
            } else if (doorType === "TRANSIT" || doorType === "OBSTRUCTION") {
                map.addLayer({
                    id: bgLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: { "line-color": primaryColor, "line-width": 5 }
                }, "anchor-door");

                map.addLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": "#000000",
                        "line-width": 3,
                        "line-dasharray": [2, 1.5, 0.1, 1.5]
                    }
                }, "anchor-door");
            }

            // Points d'extrémités des portes (cercles)
            map.addLayer({
                id: pointsLayerId,
                type: "circle",
                source: pointsSourceId,
                paint: {
                    "circle-radius": 6,
                    "circle-color": primaryColor
                }
            }, "anchor-door");
        }
    }
};