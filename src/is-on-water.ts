// @ts-nocheck
import GeoJsonLookup from "geojson-geometries-lookup";
import getMap from "@geo-maps/earth-lands-1m";

const landLookup = new GeoJsonLookup(getMap());

export const isOnWater = ({ lat, lon }: Coordinate) => {
    lat = parseFloat(lat)
    lon = parseFloat(lon)

    return {
        water: !landLookup.hasContainers({
            type: "Point",
            coordinates: [lon, lat],
        }),
        lat,
        lon,
    }
}

const isNumber = (n: any) => !isNaN(parseFloat(n)) && isFinite(n);

export type Coordinate = {
    lat: string;
    lon: string;
}

export const isCoordinate = (obj: any): boolean => {
    if (!(typeof obj === "object")) return false;

    const { lat, lon } = obj;
    if (!lat || !lon) return false;

    if (!isNumber(lat) || !isNumber(lon)) return false;

    const latF = parseFloat(lat);
    const lonF = parseFloat(lon);
    return latF <= 180 && latF >= -180 && lonF <= 180 && lonF >= -180;
};
