FROM node:20.8.0 as build

WORKDIR /usr/src/app

ADD package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
