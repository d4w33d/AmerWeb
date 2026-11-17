
import * as mapcore from "map/core.js";
import * as geo from "utils/geo.js";

export const mapStatus = {};

let initialMapCenter = [ 0, 0 ];
let initialMapZoom = 5;

export function getInitialMapCenter() {
    return initialMapCenter;
}

export function getInitialMapZoom() {
    return initialMapZoom;
}

export function updateUrl() {
    const url = window.location.pathname;
    const qs = [];
    for (let k in mapStatus) qs.push(k + (mapStatus[k] === true ? "" : ("=" + encodeURIComponent(mapStatus[k]))));
    history.pushState({}, "", url + (qs.length > 0 ? "?" + qs.join("&") : ""));
}

export function updateMapStatus(opts) {
    const map = mapcore.getMap();

    let { lng, lat } = map.getCenter();
    const zoom = map.getZoom();

    mapStatus.c = geo.roundCoordinate(lat) + "," + geo.roundCoordinate(lng);

    if (!(opts.waypoint && zoom == opts.defaults.waypointZoom) || !(!opts.waypoint && zoom === opts.defaults.zoom)) {
        mapStatus.z = geo.roundZoom(zoom);
    } else if (mapStatus.hasOwnProperty("z")) {
        delete mapStatus.z;
    }
}

export function initNavFromOptions(opts) {
    if (opts.waypoint) mapStatus.q = opts.waypoint.coordinate.lat + "," + opts.waypoint.coordinate.lon;
    if (opts.queried.center) mapStatus.c = opts.queried.center.lat + "," + opts.queried.center.lon;
    if (opts.queried.zoom) mapStatus.z = opts.queried.zoom;

    initialMapCenter = [ opts.defaults.center.lon, opts.defaults.center.lat ];
    let v = opts.defaults.zoom;

    if (opts.queried.center) initialMapCenter = [ opts.queried.center.lon, opts.queried.center.lat ];
    else if (opts.waypoint) initialMapCenter = [ opts.waypoint.coordinate.lon, opts.waypoint.coordinate.lat ];

    if (opts.queried.zoom) initialMapZoom = opts.queried.zoom;
    else if (opts.waypoint) initialMapZoom = opts.defaults.waypointZoom;

    if (opts.map && opts.queried.center === null) {
        const bnd = new geo.Boundary()

        opts.map.elements.forEach((elem) => {
            elem.data.points?.forEach((point) => bnd.add(point));
            if (elem.data.hasOwnProperty("point")) bnd.add(elem.data.point);
            if (elem.data.hasOwnProperty("p1")) bnd.add(elem.data.p1);
            if (elem.data.hasOwnProperty("p2")) bnd.add(elem.data.p2);
        });

        const container = mapcore.getContainer();

        const width = container.offsetWidth;
        const height = container.offsetHeight;
        const { center, zoom } = geo.getInitialViewFromBounds(
            bnd.lat1,
            bnd.lat2,
            bnd.lon1,
            bnd.lon2,
            width,
            height,
            Math.round(width * 0.2)
        );

        initialMapCenter = center;
        initialMapZoom = zoom;
    }
}
