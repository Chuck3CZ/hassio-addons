# Skylight (Home Assistant App)

Home Assistant App wrapper around [cpaczek/skylight](https://github.com/cpaczek/skylight) —
projects ADS-B aircraft (and a live sky layer: sun, moon, stars, satellites) onto a
ceiling/wall via a projector. This build uses the "server-driven projector" Docker
mode (server + display only, no camera tracker), with `DATA_SOURCE=api` so it needs
no RTL-SDR hardware — it pulls aircraft positions from the free airplanes.live API.

Config (`config.json`, incl. location/airport) persists across restarts via
Supervisor's per-app `/data` mount (the Dockerfile symlinks Skylight's hardcoded
`server/data` dir to it).

## Setup

1. Install this app, start it.
2. Set your location — there's no field for it in the Configuration tab (it's runtime
   state, not an app option), so use the REST API from the Home Assistant host:

   ```bash
   curl -s --get "http://127.0.0.1:3000/api/geocode" --data-urlencode "q=<your address>"
   # -> {"lat":..., "lon":..., "name":...}

   curl -s -X POST "http://127.0.0.1:3000/api/config" \
     -H "Content-Type: application/json" \
     -d '{"centerLat": 50.13, "centerLon": 14.41, "locationName": "Prague"}'
   ```

3. Optional: add your local airport's runway overlay (default is SFO):

   ```bash
   curl -s "http://127.0.0.1:3000/api/airport?code=<ICAO or IATA>"
   # feed the returned JSON straight into POST /api/config as {"airport": {...}}
   ```

   Runways only render if the airport falls within `radiusMiles` of your location —
   bump that in the same way if it's further out.

## Showing it on an actual projector

Skylight itself is just a web server — it doesn't drive HDMI output on its own. Pair
it with the community **[HAOS Kiosk Display](https://github.com/puterboy/HAOS-kiosk)**
app (adds a fullscreen kiosk browser on the host's own HDMI output), pointed at:

```
HA URL: http://127.0.0.1:3000
HA Dashboard: (leave blank)
```

**Use `127.0.0.1`, not `localhost`** — Skylight's Host-header allowlist currently
rejects IPv6 loopback (`::1`, what `localhost` resolves to first on most systems),
even though `[::1]` is nominally in its allowlist. `127.0.0.1` sidesteps it.

On Raspberry Pi 4 + recent HAOS (kernel 6.18+), the kiosk app's X server may fail
with `DRM_IOCTL_MODE_CREATE_DUMB failed: Out of memory`. Fix: in `config.txt` on the
boot partition, under `[pi4]`, change `dtoverlay=vc4-kms-v3d` to
`dtoverlay=vc4-kms-v3d,cma-256` and reboot ([details](https://github.com/puterboy/HAOS-kiosk/issues/115)).

## Known issue: airplanes.live 403

The public airplanes.live API is currently Cloudflare-blocking some IPs entirely
(403 on every request, reproducible with a plain `curl`, unrelated to this app) —
see [cpaczek/skylight#65](https://github.com/cpaczek/skylight/issues/65). If you hit
this, the sky layer (stars/sun/moon/satellites) still works; aircraft just won't
appear until it's resolved upstream, or you switch to a local receiver
(`DATA_SOURCE=radio` + an RTL-SDR feeding `dump1090`/`readsb`).
