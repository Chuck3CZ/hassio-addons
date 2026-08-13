// Applies Supervisor App options (/data/options.json) to the running Skylight
// server via its own REST API, once at container start. Skylight has no env-var
// config for these — they're runtime state normally set via its control panel.
const fs = require("node:fs");

const OPTIONS_PATH = "/data/options.json";
const BASE = "http://127.0.0.1:3000"; // 127.0.0.1, not localhost: Skylight's Host

// allowlist currently rejects the IPv6 loopback that "localhost" resolves to.

async function waitForServer(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch {
      // not up yet, keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function patchConfig(patch) {
  const res = await fetch(`${BASE}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    console.error(`[apply-options] config patch failed (${res.status}):`, await res.text());
  }
  return res.ok;
}

async function main() {
  if (!(await waitForServer())) {
    console.error("[apply-options] server did not come up in time, skipping");
    return;
  }

  let options = {};
  try {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH, "utf8"));
  } catch (err) {
    console.error("[apply-options] no options.json, skipping:", err.message);
    return;
  }

  const patch = {};
  if (typeof options.center_lat === "number") patch.centerLat = options.center_lat;
  if (typeof options.center_lon === "number") patch.centerLon = options.center_lon;
  if (options.location_name) patch.locationName = options.location_name;
  if (typeof options.radius_miles === "number") patch.radiusMiles = options.radius_miles;
  if (options.aircraft_json_url) patch.radioUrl = options.aircraft_json_url;
  if (typeof options.rotation_deg === "number") patch.rotationDeg = options.rotation_deg;
  if (options.theme) patch.theme = options.theme;

  if (Object.keys(patch).length > 0) {
    await patchConfig(patch);
    console.log("[apply-options] applied:", Object.keys(patch).join(", "));
  }

  if (options.airport_icao && String(options.airport_icao).trim()) {
    const code = String(options.airport_icao).trim();
    try {
      const r = await fetch(`${BASE}/api/airport?code=${encodeURIComponent(code)}`);
      if (r.ok) {
        const airport = await r.json();
        await patchConfig({ airport, showAirport: true });
        console.log("[apply-options] airport set:", code);
      } else {
        console.error(`[apply-options] airport lookup failed for "${code}" (${r.status})`);
      }
    } catch (err) {
      console.error("[apply-options] airport lookup error:", err.message);
    }
  }

  if (options.data_source === "radio" || options.data_source === "api") {
    try {
      const res = await fetch(`${BASE}/api/source`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: options.data_source }),
      });
      console.log("[apply-options] data source set:", options.data_source, res.status);
    } catch (err) {
      console.error("[apply-options] source set error:", err.message);
    }
  }
}

main().catch((err) => console.error("[apply-options] fatal:", err));
