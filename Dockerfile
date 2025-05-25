FROM node:22-alpine

ARG SK_HEX
ENV SK_HEX=$SK_HEX

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]