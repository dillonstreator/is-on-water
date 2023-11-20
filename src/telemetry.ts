import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ConsoleSpanExporter, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';

const telemetryEnabled = process.env.OTEL_ENABLED?.toLowerCase() === "true";
const serviceName = process.env.SERVICE_NAME || "is-on-water";
const serviceVersion = process.env.SERVICE_VERSION || 'v1.0.0';

let sdk: NodeSDK;

if (telemetryEnabled) {
    let exporter: SpanExporter;

    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT !== "") {
        exporter = new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        });
    } else {
        exporter = new ConsoleSpanExporter();
    }

    const sdk = new NodeSDK({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
        }),
        traceExporter: exporter,
        instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
}

export const tracer = trace.getTracer(serviceName, serviceVersion);

export const otlpShutdown = async () => {
    await sdk?.shutdown();
};
