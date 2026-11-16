
import * as mapcore from "map/core.js";

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

export function init() {
    onClick("#launch-app", () => {
        const map = mapcore.getMap();
        let { lng, lat } = map.getCenter();
        const zoom = map.getZoom();
        launchApp("location/" + lat + "/" + lon + "/" + zoom);
    });
}

export function showBox(boxName) {
    show("#" + boxName + "-box");
    show("#boxes");
    hideBox("launch-app")
}

export function hideBox(boxName) {
    hide("#" + boxName + "-box");
}

export function onClick(el, click) {
    all(el).forEach((element) => element.addEventListener("click", click));
}

export function showMapInfo(map) {
    setText("#map-info-slug", map.slug);
    setText("#map-info-name", map.name);
    onClick("#map-info-open", () => launchApp("map/" + map.slug));
    showBox("map-info");
}

export function launchApp(path = "") {
    window.location = "https://app.amernav.com/" + path;
}
