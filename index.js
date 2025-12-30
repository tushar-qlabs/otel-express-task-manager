const express = require('express');
const winston = require('winston');
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport');
const { trace } = require('@opentelemetry/api');

const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        new OpenTelemetryTransportV3()
    ]
});

const tracer = trace.getTracer('otel-express-logs');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
    logger.info('Received request on root endpoint');
    res.send('Hello World!');
});

const simulateSlowFunction = async () => {
    const delay = Math.floor(Math.random() * 1000) + 2000; // 2000-3000ms
    return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulate a slow function randomly internally
const runSlowTaskLoop = async () => {
    while (true) {
        const nextRunDelay = Math.floor(Math.random() * 4000) + 1000;
        await new Promise(resolve => setTimeout(resolve, nextRunDelay));

        await tracer.startActiveSpan('internal-slow-task', async (span) => {
            logger.info('Starting internal slow task...');
            try {
                await simulateSlowFunction();
                span.addEvent('Task completed');
            } catch (err) {
                span.recordException(err);
            } finally {
                logger.info('Finished internal slow task.');
                span.end();
            }
        });
    }
};

runSlowTaskLoop();

app.listen(port, () => {
    logger.info(`Example app listening at http://localhost:${port}`);
});

// Emit logs at intervals
setInterval(() => {
    const levels = ['info', 'warn', 'error'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = `Sample log message at ${new Date().toISOString()}`;

    if (level === 'info') {
        logger.info(message);
    } else if (level === 'warn') {
        logger.warn(message);
    } else if (level === 'error') {
        logger.error(message);
    }
}, Math.floor(Math.random() * 3000) + 1000); // Random interval between 1000ms and 4000ms
