# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for installing production dependencies.
FROM base as deps

# First, copy the package files and run npm install to update package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# Then, use the updated package-lock.json for npm ci
RUN --mount=type=cache,target=/root/.npm \
    npm ci

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
FROM base as final

# Copy the source code into the image.
COPY . .

# Copy the dependencies from the deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD npm run dev
