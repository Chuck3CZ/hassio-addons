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

1. Install this app.
2. In the **Configuration** tab, set:
   - `center_lat` / `center_lon` — your coordinates (decimal degrees). Look them up
     with `curl -s --get "http://127.0.0.1:3000/api/geocode" --data-urlencode "q=<your address>"`
     from the Home Assistant host if you don't have them handy.
   - `location_name` — display name for the location.
   - `radius_miles` — how far out to show traffic (default 3). Also determines
     whether `airport_icao`'s runway overlay falls in view.
   - `airport_icao` — ICAO or IATA code for a runway overlay (optional, default is
     none — upstream Skylight itself defaults to SFO, this app doesn't preset one).
   - `data_source` — `api` (default, no hardware, free airplanes.live feed) or
     `radio` (a local dump1090/readsb feed via `aircraft_json_url`).
   - `rotation_deg`, `theme` — optional display tweaks.
3. Start (or Restart) the app — `apply-options.js` pushes these into Skylight's own
   REST API (`/api/config`, `/api/airport`, `/api/source`) once at boot, since
   Skylight has no native env-var config for them (it's runtime state normally set
   from its own control panel). Leave a field blank/unset to not touch that setting
   (e.g. on later restarts, once you've since fine-tuned things from `/control`).

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
