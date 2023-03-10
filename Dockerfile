FROM node:18-bullseye
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y sudo curl systemctl clamav clamav-daemon
RUN yarn install --production
ENTRYPOINT sh ./run.sh
#CMD ["node", "index.js"]
EXPOSE 3000
