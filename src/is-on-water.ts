// geo-maps / geojson-geometries-lookup ship without TypeScript types
// @ts-nocheck
import GeoJsonLookup from "geojson-geometries-lookup";
import getMapWaterbodies from "@geo-maps/earth-waterbodies-1m";

const waterLookup = new GeoJsonLookup(getMapWaterbodies());

export type Coordinate = {
    lat: number;
    lon: number;
};

export type IsOnWaterResult = {
    water: boolean;
    lat: number;
    lon: number;
};

export const isOnWater = ({ lat, lon }: Coordinate): IsOnWaterResult => {
    const water = waterLookup.hasContainers({
        type: "Point",
        coordinates: [lon, lat],
    });

    return {
        water,
        lat,
        lon,
    };
};
