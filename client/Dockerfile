# client/Dockerfile

# ─── STAGE 1: BUILD ─────────────────────────────────────
# This stage compiles your React app into static files.
# Everything in this stage gets discarded after the build completes.

FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Receive the build arg passed from docker-compose.yml
ARG VITE_API_URL
# Expose it as an environment variable DURING the build step,
# so Vite can actually read it via import.meta.env.VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── STAGE 2: SERVE ─────────────────────────────────────
# This stage is a completely separate, minimal image.
# nginx is a lightweight, battle-tested web server — perfect
# for serving static files, and far smaller than a Node.js image.

FROM nginx:alpine

# Copy ONLY the compiled dist/ folder from the build stage above.
# --from=build refers back to the stage we named earlier.
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx config (created next) that handles
# React Router's client-side routing correctly.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# nginx's default startup command — runs in the foreground
# so Docker can track the container's running state correctly.
CMD ["nginx", "-g", "daemon off;"]