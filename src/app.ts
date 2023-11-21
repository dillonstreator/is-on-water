import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestListener } from 'node:http';
import path from 'node:path';
import express, { json, urlencoded } from 'express';
import pino from 'pino';
import helmet from 'helmet';
import compression from 'compression';
import { getClientIp } from 'request-ip';
import { createClient } from 'redis';
import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { Config } from './config';
import { Coordinate, isOnWater, isCoordinate } from './is-on-water';
import { tracer } from './telemetry';

const indexHTMLPath = path.join(__dirname, "public", "index.html");

export type App = {
    requestListener: RequestListener,
    shutdown: () => Promise<void>,
}

export const initApp = async (config: Config, logger: pino.Logger): Promise<App> => {
    const redisClient = await createClient({
        url: config.redisUrl,
    }).connect();

    const limiter = rateLimit({
        windowMs: config.rateLimitWindowMs,
        max: config.rateLimitMax,
        store: new RedisStore({
            sendCommand: (...args: string[]) => redisClient.sendCommand(args),
        })
    });

    const app = express();
    if (config.trustProxy) {
        app.set("trust proxy", true);
    }

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
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                "script-src": "'self' 'unsafe-inline' https://unpkg.com",
                "img-src": "'self' data: https://tile.openstreetmap.org https://railway.app"
            }
        }
    }));
    app.use(compression());
    app.use(urlencoded());
    app.use(json());

    app.get(config.healthCheckEndpoint, (req, res) => {
        res.sendStatus(200);
    });

    app.use(limiter);

    app.get("/", (req, res) => {
        res.sendFile(indexHTMLPath);
    });

    app.get("/api/is-on-water", async (req, res) => {
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

    app.post("/api/is-on-water", (req, res) => {
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
            await redisClient.disconnect();
        },
    }
}

type Store = {
    logger: pino.Logger;
    requestId: string;
}

const asl = new AsyncLocalStorage<Store>();
