import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5050;
const ARANET_BASE_URL = process.env.ARANET_BASE_URL || "https://aranet.cloud";
const ARANET_API_KEY = process.env.ARANET_API_KEY;

if (!ARANET_API_KEY) {
  console.error("Falta ARANET_API_KEY en el archivo .env");
  process.exit(1);
}

function headersAranet() {
  return {
    Accept: "application/json",
    ApiKey: ARANET_API_KEY,
  };
}

async function aranetGet(path, query = {}) {
  const url = new URL(`${ARANET_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, { headers: headersAranet() });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Aranet respondió ${response.status}: ${text}`);
  }

  return response.json();
}

// 1) Healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true }));

// 2) Sensores (metadata)
app.get("/api/aranet/sensors", async (req, res) => {
  try {
    const data = await aranetGet("/api/v1/sensors");
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// 3) Telemetría última (para tus tiles del dashboard)
app.get("/api/aranet/telemetry/last", async (req, res) => {
  try {
    // Pasa filtros opcionales vía querystring: ?sensor=...&metric=...
    const data = await aranetGet("/api/v1/telemetry/last", req.query);
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// 4) Telemetría histórica (para gráficos)
app.get("/api/aranet/telemetry/history", async (req, res) => {
  try {
    // Ejemplo: ?sensor=ID&from=...&to=... etc (según soporte del API)
    const data = await aranetGet("/api/v1/telemetry/history", req.query);
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// 5) Alarmas actuales
app.get("/api/aranet/alarms/actual", async (req, res) => {
  try {
    const data = await aranetGet("/api/v1/alarms/actual", req.query);
    res.json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listo en http://localhost:${PORT}`);
});
