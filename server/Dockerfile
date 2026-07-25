# server/Dockerfile

# Start from an official, lightweight Node.js image.
# "alpine" is a minimal Linux distribution — much smaller than the default,
# which matters for image size and deployment speed.
FROM node:20-alpine

# Set the working directory inside the container.
# All subsequent commands run relative to this path.
WORKDIR /app

# Copy ONLY package files first, not the whole codebase yet.
# This is a deliberate optimization: Docker caches each step (layer).
# If package.json hasn't changed, Docker reuses the cached "npm install"
# result instead of re-running it every time you change a source file.
COPY package*.json ./

# Install dependencies inside the container.
# This runs fresh, based on the container's own OS — important because
# some npm packages compile native code specific to the OS they're installed on.
RUN npm install --production

# NOW copy the rest of the application code.
# This layer changes often (every code edit), but since it comes AFTER
# npm install, changing your source code doesn't force a reinstall.
COPY . .

# Document which port this container listens on.
# This is informational for anyone reading the Dockerfile — it does NOT
# actually publish the port. That happens later in docker-compose.yml.
EXPOSE 5000

# The command that runs when the container starts.
# Uses the production start script, not the dev one with nodemon —
# nodemon's file-watching is a development convenience, unnecessary
# (and wasteful) inside a container that gets rebuilt on every code change anyway.
CMD ["node", "src/index.js"]