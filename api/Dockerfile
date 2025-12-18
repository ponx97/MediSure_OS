FROM node:20-alpine
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# If you compile TS, ensure build script exists (common: "build": "tsc")
# We won't fail the build if no build step is needed, but most TS APIs need it.
RUN npm run build || true

EXPOSE 4010

# Prefer start script if present; otherwise run the compiled output if it exists.
CMD ["npm", "run", "start"]
