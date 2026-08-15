FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
RUN git clone --depth 1 https://github.com/cpaczek/skylight.git .
COPY patch-textscale.cjs .
RUN node patch-textscale.cjs
RUN pnpm install --frozen-lockfile --filter server --filter web --filter shared
RUN pnpm -F web build

# Skylight hardcodes its data dir to server/data (config.json, caches) — point
# it at Supervisor's persistent /data mount so config survives app restarts.
RUN rm -rf /app/server/data && ln -s /data /app/server/data

COPY apply-options.js /apply-options.js
COPY run.sh /run.sh
RUN chmod +x /run.sh

ENV HOST=0.0.0.0 PORT=3000 NODE_ENV=production DATA_SOURCE=api
EXPOSE 3000
CMD ["/run.sh"]
