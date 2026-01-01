# Express Task Manager with OpenTelemetry

A robust Node.js Task Management API instrumented with a full OpenTelemetry observability stack (Loki, Tempo, Prometheus, Grafana).

![OTel Pipeline Diagram](./otel_flow_diagram.png)

## Features

*   **API:** Express.js REST API with SQLite database.
*   **Logging:** Winston logging (transported to Loki).
*   **Tracing:** OpenTelemetry Tracing (manual & auto) sent to Tempo.
*   **Metrics:** Prometheus metrics exposed for scraping.
*   **Visualization:** Local Grafana instance pre-configured with all data sources.

## Architecture

The system uses the **OpenTelemetry Collector** as a central hub:
1.  **Node.js App** pushes data (OTLP) -> **Collector**.
2.  **Collector** pushes Logs -> **Loki**.
3.  **Collector** pushes Traces -> **Tempo**.
4.  **Prometheus** pulls Metrics <- from **Collector**.

## Prerequisites

*   Node.js (v18+)
*   Docker & Docker Compose

## Quick Start

### 1. Start the Observability Stack
Run the following command to spin up Grafana, Loki, Tempo, Prometheus, and the Collector:
```bash
docker compose up -d
```
*Wait about 10-20 seconds for all services to initialize.*

### 2. Start the Application
Run the Node.js application with the OpenTelemetry instrumentation loaded:
```bash
npm install
node --require ./src/observability/instrumentation.js src/index.js
```
The app will start at `http://localhost:3000`.

### 3. Explore Data
*   **Grafana:** [http://localhost:3001](http://localhost:3001)
*   **API Health:** [http://localhost:3000/tasks](http://localhost:3000/tasks)

---

## How to Debug

### Checking Traces (Tempo)
1.  Go to **Grafana -> Explore**.
2.  Select **Tempo** from the dropdown.
3.  Query Type: **Search**.
4.  Service Name: `task-manager`.
5.  Click any Trace ID to see the full request timeline (e.g., `create-task-controller` spans).

### Checking Logs (Loki)
1.  Go to **Grafana -> Explore**.
2.  Select **Loki** from the dropdown.
3.  Label Browser: Select `service_name` -> `task-manager`.
4.  Or run query: `{service_name="task-manager"}`.

### Checking Metrics (Prometheus)
1.  Go to **Grafana -> Explore**.
2.  Select **Prometheus** from the dropdown.
3.  Search for metrics like `http_server_duration_milliseconds_count`.
