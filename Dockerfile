# install latest node
# https://hub.docker.com/_/node/
FROM node:9.8

# create and set app directory
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

# install app dependencies
# this is done before the following COPY command to take advantage of layer caching
COPY ["package.json", "npm-shrinkwrap.json*", "./"] # remember the working directory is `/usr/src/app/`
RUN npm install

# copy app source to destination container
COPY . .

# expose container port
EXPOSE 6767

CMD node .
