FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install
COPY ./src ./src
COPY ./tsconfig.json ./
RUN npm run build

FROM node:20-alpine AS install
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install --omit=dev

FROM gcr.io/distroless/nodejs20-debian12 AS runtime
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist/ ./
COPY --from=install /usr/src/app/node_modules ./node_modules
CMD [ "index.js" ]