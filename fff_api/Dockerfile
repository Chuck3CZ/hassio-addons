ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install environment
RUN apk add --no-cache --virtual build-deps alpine-sdk cmake git \
            python3 python3-dev py3-pip build-base

# Upgrade pip and install Python packages
RUN pip3 install --upgrade pip
RUN pip3 install flask flask-cors

# Clone your API
RUN git clone https://github.com/Chuck3CZ/flashforge-finder-api.git /fff_api

# Copy services
COPY rootfs /

#RUN chmod +x /etc/cont-init.d/fff-api.sh
#RUN chmod +x /etc/services.d/fff-api/*
RUN chmod +x /fff-api/run
# Optional: remove build deps to slim down image
#RUN apk del build-deps
