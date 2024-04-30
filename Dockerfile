FROM node:lts-alpine as build-stage

WORKDIR /app
COPY . .
RUN mkdir /temp

ENV NODE_ENV=production
ENV PORT=3000

VOLUME ["/app"]

RUN npm install
EXPOSE $PORT

ENTRYPOINT ["npm", "start"]