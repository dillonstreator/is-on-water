import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestListener } from 'node:http';
import express, { json, urlencoded } from 'express';
import pino from 'pino';
import helmet from 'helmet';
import compression from 'compression';
import { getClientIp } from 'request-ip';
import { Config } from './config';
import { Coordinate, isOnWater, isCoordinate } from './is-on-water';
import { tracer } from './telemetry';

export type App = {
    requestListener: RequestListener,
    shutdown: () => Promise<void>,
}

export const initApp = async (config: Config, logger: pino.Logger): Promise<App> => {
    const app = express();
    app.set("trust proxy", true);
    app.use((req, res, next) => {
        const start = new Date().getTime();

        const requestId = req.headers['x-request-id']?.[0] || randomUUID();

        const l = logger.child({ requestId });

        res.on("finish", () => {
            l.info({
                duration: new Date().getTime() - start,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                ua: req.headers['user-agent'],
                ip: getClientIp(req),
            }, "Request handled");
        });

        asl.run({ logger: l, requestId }, () => next());
    });
    app.use(helmet());
    app.use(compression());
    app.use(urlencoded());
    app.use(json());

    app.get(config.healthCheckEndpoint, (req, res) => {
        res.sendStatus(200);
    });

    app.get("/", (req, res) => {
        if (!isCoordinate(req.query))
            return res
                .status(400)
                .send(
                    "'lat' and 'lon' query parameters required representing a valid lat/lon (-180 < lat/lon < 180)"
                );
        const { lat, lon } = req.query as Coordinate;

        const span = tracer.startSpan("isOnWater");
        span.setAttribute("count", 1);
        const result = isOnWater({ lat, lon });
        span.end();

        res.json(result);
    });

    app.post("/", (req, res) => {
        const coordinates = req.body;
        if (!Array.isArray(coordinates))
            return res.status(400).send("body must be an array of coordinates");

        if (!coordinates.every(isCoordinate))
            return res
                .status(400)
                .send(
                    "body must be an array of objects containing keys 'lat' and 'lon' representing a valid lat/lon (-180 < lat/lon < 180)"
                );

        const span = tracer.startSpan("isOnWater");
        span.setAttribute("count", coordinates.length);
        const result = coordinates.map(isOnWater);
        span.end();

        res.json(result);
    });

    return {
        requestListener: app,
        shutdown: async () => {
            // add any cleanup code here including database/redis disconnecting and background job shutdown
        },
    }
}

type Store = {
    logger: pino.Logger;
    requestId: string;
}

const asl = new AsyncLocalStorage<Store>();
