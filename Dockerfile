FROM node:carbon-alpine
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD [ "npm", "start" ]

#docker build . -t ServiceA-Image
#docker run -it --name serviceA-Cont -d -p 5000:5000 ServiceA-Image