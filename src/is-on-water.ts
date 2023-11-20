// @ts-nocheck
import GeoJsonLookup from "geojson-geometries-lookup";
import getMapSeas from "@geo-maps/earth-seas-1m";
import getMapLakes from "@geo-maps/earth-lakes-1m";
import getMapRivers from "@geo-maps/earth-rivers-1m";

const seasLookup = new GeoJsonLookup(getMapSeas());
const lakesLookup = new GeoJsonLookup(getMapLakes());
const riversLookup = new GeoJsonLookup(getMapRivers());

const hasContainer = ({lookups, lat, lon}) => lookups.some(l => l.hasContainers({
    type: "Point",
    coordinates: [lon, lat],
}));

export const isOnWater = ({ lat, lon }: Coordinate) => {
    lat = parseFloat(lat)
    lon = parseFloat(lon)

    const water = hasContainer({
        lookups: [seasLookup, lakesLookup, riversLookup],
        lat,
        lon,
    })

    return {
        water,
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
