
import * as mapcore from "map/core.js";
import * as geo from "utils/geo.js";
import * as bitmap from "utils/bitmap.js";

export function renderMapElement(type, elem) {
    if (type in MapElementRenderer) {
        MapElementRenderer[type].render(elem, mapcore.getMap());
    }
}

export const MapElementRenderer = {

    Route: {
        render(elem, map) {
            const baseId = elem.id || mapcore.getNextLayerId("route");
            const sourceId = `source_route_${baseId}`;
            const textSourceId = `source_route_text_${baseId}`;
            const outlineLayerId = `outline_route_${baseId}`;
            const lineLayerId = `layer_route_${baseId}`;
            const textLayerId = `layer_route_text_${baseId}`;

            const points = (elem.data.points || []).map(geo.getCoords);
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
                mapcore.addAnchoredLayer({
                    id: outlineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#FFFFFF", "line-width": 5.5 }
                }, "route");
            }

            // Trait cœur vert (#6CBB02)
            if (!map.getLayer(lineLayerId)) {
                mapcore.addAnchoredLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": "#6CBB02", "line-width": 3 }
                }, "route");
            }

            // Cartouches de distances et directions par segment
            if (!map.getLayer(textLayerId)) {
                mapcore.addAnchoredLayer({
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
                }, "route");
            }

            // Calcul et enregistrement des badges de segments
            const textFeatures = [];
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const dist = geo.calculateDistanceNM(p1, p2);
                const bearing = Math.round(geo.calculateBearing(p1, p2));
                const midLon = (p1[0] + p2[0]) / 2;
                const midLat = (p1[1] + p2[1]) / 2;
                const isLeft = p2[0] < p1[0];

                let angle = bearing - 90;
                while (angle <= -90) angle += 180;
                while (angle > 90) angle -= 180;

                const labelText = `${geo.formatDistance(dist)} ${bearing}°`;
                const imageId = `badge_${baseId}_${i}_${bearing}_${isLeft}`;

                if (!map.hasImage(imageId)) {
                    const imgData = bitmap.createTextBadgeImage(labelText, "#6CBB02", isLeft);
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
            const baseId = elem.id || mapcore.getNextLayerId("waypoint");
            const sourceId = `source_waypoint_${baseId}`;
            const layerId = `layer_waypoint_${baseId}`;
            const [lon, lat] = geo.getCoords(elem.data.point);

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
                mapcore.addAnchoredLayer({
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
                }, "waypoint");
            }
        }
    },

    MultiSegmentLine: {
        render(elem, map) {
            const baseId = elem.id || mapcore.getNextLayerId("line");
            const sourceId = `source_line_${baseId}`;
            const haloLayerId = `halo_line_${baseId}`;
            const lineLayerId = `layer_line_${baseId}`;
            const points = (elem.data.points || []).map(geo.getCoords);

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
                mapcore.addAnchoredLayer({
                    id: haloLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": color,
                        "line-width": width + 6,
                        "line-opacity": 0.2
                    }
                }, "multi-segment-line");
            }

            // Ligne principale
            if (!map.getLayer(lineLayerId)) {
                mapcore.addAnchoredLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": color,
                        "line-width": width
                    }
                }, "multi-segment-line");
            }
        }
    },

    Polygon: {
        render(elem, map) {
            const baseId = elem.id || mapcore.getNextLayerId("polygon");
            const sourceId = `source_polygon_${baseId}`;
            const fillLayerId = `layer_polygon_fill_${baseId}`;
            const lineLayerId = `layer_polygon_line_${baseId}`;

            let rawPoints = (elem.data.points || []).map(geo.getCoords);
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
                mapcore.addAnchoredLayer({
                    id: fillLayerId,
                    type: "fill",
                    source: sourceId,
                    paint: { "fill-color": color, "fill-opacity": 0.6 }
                }, "polygon");
            }

            if (strokePx > 0 && !map.getLayer(lineLayerId)) {
                mapcore.addAnchoredLayer({
                    id: lineLayerId,
                    type: "line",
                    source: sourceId,
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: { "line-color": color, "line-width": strokePx }
                }, "polygon");
            }
        }
    },

    TextLabel: {
        render(elem, map) {
            const baseId = elem.id || mapcore.getNextLayerId("label");
            const sourceId = `source_label_${baseId}`;
            const layerId = `layer_label_${baseId}`;
            const [lon, lat] = geo.getCoords(elem.data.point);
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
                const imgData = bitmap.createLabelBitmapImage(text);
                map.addImage(imageId, imgData);
            }

            if (!map.getLayer(layerId)) {
                mapcore.addAnchoredLayer({
                    id: layerId,
                    type: "symbol",
                    source: sourceId,
                    layout: {
                        "icon-image": imageId,
                        "icon-anchor": "center",
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true
                    }
                }, "textLabel");
            }
        }
    },

    Door: {
        render(elem, map) {
            const baseId = elem.id || mapcore.getNextLayerId("door");
            const lineSourceId = `source_door_line_${baseId}`;
            const pointsSourceId = `source_door_points_${baseId}`;
            const haloLayerId = `layer_door_halo_${baseId}`;
            const bgLayerId = `layer_door_bg_${baseId}`;
            const mainLayerId = `layer_door_main_${baseId}`;
            const pointsLayerId = `layer_door_points_${baseId}`;

            const p1 = geo.getCoords(elem.data.p1);
            const p2 = geo.getCoords(elem.data.p2);

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
            mapcore.addAnchoredLayer({
                id: haloLayerId,
                type: "line",
                source: lineSourceId,
                layout: { "line-cap": "round" },
                paint: {
                    "line-color": primaryColor,
                    "line-width": 10,
                    "line-opacity": 0.25
                }
            }, "door");

            if (doorType === "START_LINE" || doorType === "FINISH_LINE") {
                mapcore.addAnchoredLayer({
                    id: bgLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: { "line-color": "#FFFFFF", "line-width": 5 }
                }, "door");

                mapcore.addAnchoredLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": primaryColor,
                        "line-width": 3,
                        "line-dasharray": [0.5, 1.25]
                    }
                }, "door");
            } else if (doorType === "GATE") {
                mapcore.addAnchoredLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": primaryColor,
                        "line-width": 4,
                        "line-dasharray": [2, 1.5, 0.1, 1.5]
                    }
                }, "door");
            } else if (doorType === "TRANSIT" || doorType === "OBSTRUCTION") {
                mapcore.addAnchoredLayer({
                    id: bgLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: { "line-color": primaryColor, "line-width": 5 }
                }, "door");

                mapcore.addAnchoredLayer({
                    id: mainLayerId,
                    type: "line",
                    source: lineSourceId,
                    layout: { "line-cap": "round" },
                    paint: {
                        "line-color": "#000000",
                        "line-width": 3,
                        "line-dasharray": [2, 1.5, 0.1, 1.5]
                    }
                }, "door");
            }

            // Points d'extrémités des portes (cercles)
            mapcore.addAnchoredLayer({
                id: pointsLayerId,
                type: "circle",
                source: pointsSourceId,
                paint: {
                    "circle-radius": 6,
                    "circle-color": primaryColor
                }
            }, "door");
        }
    }

};
