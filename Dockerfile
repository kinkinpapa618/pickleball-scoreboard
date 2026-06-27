# Stage 1: Build the Application
FROM node:22 AS build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build && npm install --omit=dev

# Stage 2: Production Image
FROM node:22

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package*.json ./

ENV PORT=5000
EXPOSE 5000

USER node

CMD ["node", "dist/index.cjs"]
