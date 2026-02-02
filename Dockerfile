
# Stage 1: Build the frontend
FROM node:20-slim as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Node.js backend
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=build-stage /app/dist ./dist
COPY server ./server
COPY .env* ./

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
