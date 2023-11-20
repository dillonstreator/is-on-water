
import pino from 'pino';
import request from 'supertest';
import { App, initApp } from './app';
import { Config, initConfig } from './config';

const nopLogger = pino({ enabled: false });

describe("app", () => {
    let app: App;
    let config: Config;
    beforeAll(async () => {
        config = {
            ...(await initConfig()),
            healthCheckEndpoint: "/some-health-check-endpoint"
        };
        app = await initApp(config, nopLogger);
    });
    afterAll(async () => {
        await app?.shutdown();
    });

    it("should return 200 for config health check endpoint", async () => {
        await request(app.requestListener)
            .get(config.healthCheckEndpoint)
            .expect(200);
    });

    it("should indicate water", async () => {
        // https://www.latlong.net/c/?lat=20.112682&long=-37.048647
        const lat = 20.112682;
        const lon = -37.048647;
        await request(app.requestListener)
            .get(`/?lat=${lat}&lon=${lon}`)
            .expect(200)
            .then(res => {
                expect(res.body).toEqual({ lat, lon, water: true });
            });
    });

    it("should indicate no water", async () => {
        // https://www.latlong.net/c/?lat=40.292097&long=-98.613164
        const lat = 40.292097;
        const lon = -98.613164;
        await request(app.requestListener)
            .get(`/?lat=${lat}&lon=${lon}`)
            .expect(200)
            .then(res => {
                expect(res.body).toEqual({ lat, lon, water: false });
            });
    });
});
