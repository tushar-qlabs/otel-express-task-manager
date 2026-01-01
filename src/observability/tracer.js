const { trace } = require('@opentelemetry/api');

// Helper to get the tracer instance easily
const getTracer = () => trace.getTracer('otel-express-logs');

module.exports = { getTracer };
