
import * as mapcore from "map/core.js";
import * as geo from "utils/geo.js";

export function ready(func) {
    document.addEventListener("DOMContentLoaded", () => func());
}

export function all(el, container = null, multiple = true) {
    if (container === null) container = document;
    if (typeof el === "string") return multiple ? [...container.querySelectorAll(el)] : container.querySelector(el);
    if (el instanceof NodeList) return multiple ? [...el] : el.item(0);
    if (el instanceof Node) return multiple ? [ el ] : el;
    if (el instanceof Array) return multiple ? el : (el.length > 0 ? el[0] : null);
    return multiple ? [] : null;
}

export function one(el, container = null) {
    return all(el, container, false);
}

export function each(el, func) {
    all(el).every((element, index) => { return func(element, index) !== false; });
}

export function addClass(el, cl) { each(el, (element) => { element.classList.add(cl); }); }
export function removeClass(el, cl) { each(el, (element) => { element.classList.remove(cl); }); }

export function show(el) { removeClass(el, "off"); }
export function hide(el) { addClass(el, "off"); }

export function setHtml(el, html) { each(el, (element) => { element.innerHTML = html; }); }
export function setText(el, text) { each(el, (element) => { element.innerText = text; }); }

export function toggleAndSetHtml(el, html) {
    setText(el, html);
    if (html) show(el); else hide(el);
}

export function toggleAndSetText(el, text) {
    setHtml(el, text);
    if (text) show(el); else hide(el);
}

let currentMap = null;
let currentWaypoint = null;

export function init() {
    onClick("#launch-app", () => {
        const map = mapcore.getMap();
        let { lng, lat } = map.getCenter();
        const zoom = map.getZoom();
        launchApp("location/" + lat + "/" + lon + "/" + zoom);
    });

    onClick("#map-info-open", () => {
        if (currentMap) launchApp("map/" + currentMap.slug);
    });

    onClick("#waypoint-info-open", () => {
        if (currentWaypoint) launchApp("waypoint/"
            + encodeURIComponent(currentWaypoint.coordinate.lat) + "/"
            + encodeURIComponent(currentWaypoint.coordinate.lon));
    });

    onClick("#waypoint-info-third-party-openseamap", () => {
        if (currentWaypoint) openWaypointInThirdPartyMap("openseamap", currentWaypoint);
    });
    onClick("#waypoint-info-third-party-openstreetmap", () => {
        if (currentWaypoint) openWaypointInThirdPartyMap("openstreetmap", currentWaypoint);
    });
    onClick("#waypoint-info-third-party-googlemaps", () => {
        if (currentWaypoint) openWaypointInThirdPartyMap("googlemaps", currentWaypoint);
    });
}

export function hideLoading() {
    hide("#loading");
}

export function showLoading() {
    show("#loading");
}

export function showBox(boxName) {
    show("#" + boxName + "-box");
    show("#boxes");
    hideBox("launch-app")
}

export function hideBox(boxName) {
    hide("#" + boxName + "-box");
}

export function on(el, evt, func) {
    all(el).forEach((element) => element.addEventListener(evt, func));
}

export function onClick(el, func) {
    on(el, "click", func);
}

export function openWaypointInThirdPartyMap(service, waypoint) {
    let url = {
        openseamap: "https://map.openseamap.org/?lat={lat}&lon={lon}&mlat={lat}&mlon={lon}&mtext=Waypoint",
        openstreetmap: "https://www.openstreetmap.org/?mlat={lat}&mlon={lon}",
        googlemaps: "https://maps.google.com/?q={lat},{lon}",
    }[service];

    url = url
        .replace(/\{lat\}/g, encodeURIComponent(waypoint.coordinate.lat))
        .replace(/\{lon\}/g, encodeURIComponent(waypoint.coordinate.lon));

    window.open(url);
}

export function showMapInfo(map) {
    currentMap = map;

    setText("#map-info-slug", map.slug);
    toggleAndSetText("#map-info-name", map.name);
    showBox("map-info");
}

export function showWaypointInfo(waypoint) {
    currentWaypoint = waypoint;

    toggleAndSetText("#waypoint-info-name", waypoint.name);
    setText("#waypoint-info-coordinate-lat-dms", geo.formatLatitudeToDMS(waypoint.coordinate.lat));
    setText("#waypoint-info-coordinate-lon-dms", geo.formatLongitudeToDMS(waypoint.coordinate.lon));
    setText("#waypoint-info-coordinate-dec", Number(waypoint.coordinate.lat.toFixed(5)) + ", " + Number(waypoint.coordinate.lon.toFixed(5)));
    showBox("waypoint-info");
}

export function launchApp(path = "") {
    window.location = "https://app.amernav.com/" + path;
}
