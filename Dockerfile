FROM node:14

WORKDIR /var/www/app

COPY . .

RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
