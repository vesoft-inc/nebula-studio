FROM node:10-alpine as builder
# Set the working directory to /app
WORKDIR /nebula-web-console
# Copy the current directory contents into the container at /app
COPY package.json /nebula-web-console/
COPY .npmrc /nebula-web-console/
# Install any needed packages
RUN npm install
COPY . /nebula-web-console/

# build and remove front source code
RUN npm run build && npm run tsc && rm -rf app/assets/*
COPY ./app/assets/index.html  /nebula-web-console/app/assets/

FROM node:10-alpine
 # Make port available to the world outside this container

WORKDIR /nebula-web-console
COPY --from=builder ./nebula-web-console/package.json /nebula-web-console/
COPY .npmrc /nebula-web-console/
COPY --from=builder /nebula-web-console/app /nebula-web-console/app
COPY --from=builder /nebula-web-console/config /nebula-web-console/config
RUN npm install --production

EXPOSE 7001

CMD ["npm", "run", "docker-start"]
