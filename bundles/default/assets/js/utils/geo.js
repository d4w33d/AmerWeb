
export function roundCoordinate(coord) {
    return Math.round(coord * 1000000) / 1000000;
}

export function roundZoom(zoom) {
    return Math.round(zoom * 100) / 100;
}

export function getInitialViewFromBounds(lat1, lat2, lon1, lon2, width, height, padding = 0) {
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
}

export function getCoords(pt) {
    if (!pt) return [0, 0];
    const lon = pt.lon ?? pt.longitude ?? 0;
    const lat = pt.lat ?? pt.latitude ?? 0;
    return [lon, lat];
}

export function calculateDistanceNM(p1, p2) {
    const R = 3440.065;
    const dLat = (p2[1] - p1[1]) * Math.PI / 180;
    const dLon = (p2[0] - p1[0]) * Math.PI / 180;
    const lat1 = p1[1] * Math.PI / 180;
    const lat2 = p2[1] * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export function calculateBearing(p1, p2) {
    const lon1 = p1[0] * Math.PI / 180;
    const lon2 = p2[0] * Math.PI / 180;
    const lat1 = p1[1] * Math.PI / 180;
    const lat2 = p2[1] * Math.PI / 180;
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}

export function formatDistance(distNM) {
    return distNM < 1 ? `${(distNM * 1000).toFixed(0)} m` : `${distNM.toFixed(1)} NM`;
}

export function formatLatitudeToDMS(latitude) {
    const direction = latitude >= 0 ? "N" : "S";
    const absLat = Math.abs(latitude);
    const degrees = Math.floor(absLat);
    const remainderMin = (absLat - degrees) * 60.0;
    const minutes = Math.floor(remainderMin);
    const seconds = (remainderMin - minutes) * 60.0;

    const padMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = seconds.toFixed(2);

    return `${direction} ${degrees}° ${padMinutes}' ${formattedSeconds}"`;
}

export function formatLongitudeToDMS(longitude) {
    const direction = longitude >= 0 ? "E" : "W";
    const absLon = Math.abs(longitude);
    const degrees = Math.floor(absLon);
    const remainderMin = (absLon - degrees) * 60.0;
    const minutes = Math.floor(remainderMin);
    const seconds = (remainderMin - minutes) * 60.0;

    const padMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = seconds.toFixed(2);

    return `${direction} ${degrees}° ${padMinutes}' ${formattedSeconds}"`;
}

export function calculatePolygonAreaSqNM(points) {
    if (!points || points.length < 3) return 0.0;

    const origin = points[0];
    const refLat = origin.latitude;
    const cosLat = Math.cos((refLat * Math.PI) / 180.0);

    const cartesianPoints = points.map(pt => {
        const dx = (pt.longitude - origin.longitude) * 60.0 * cosLat;
        const dy = (pt.latitude - origin.latitude) * 60.0;
        return { x: dx, y: dy };
    });

    let area = 0.0;
    const n = cartesianPoints.length;
    for (let i = 0; i < n; i++) {
        const p1 = cartesianPoints[i];
        const p2 = cartesianPoints[(i + 1) % n];
        area += (p1.x * p2.y) - (p2.x * p1.y);
    }

    return Math.abs(area) / 2.0;
}

export class Boundary {

    lat1 = null;
    lat2 = null;
    lon1 = null;
    lon2 = null;

    add(type, val) {
        if (type instanceof Array) {
            type.forEach((pt) => this.add(pt));
            return this;
        }

        if (type instanceof Object) {
            this.lat(type.lat);
            this.lon(type.lon);
            return this;
        }

        this[type + "1"] = this[type + "1"] == null ? val : Math.min(this[type + "1"], val);
        this[type + "2"] = this[type + "2"] == null ? val : Math.max(this[type + "2"], val);
        return this;
    }

    lat(val) {
        this.add("lat", val);
        return this;
    }

    lon(val) {
        this.add("lon", val);
        return this;
    }

}
