FROM node:lts-alpine

WORKDIR /app

COPY . /aiservicelab-homepage-server

RUN npm i

EXPOSE 3002

CMD ["node", "app.js"]