FROM node:10-alpine as builder
# Set the working directory to /app
WORKDIR /nebula-web-console
# Copy the current directory contents into the container at /app
COPY package.json /nebula-web-console/
COPY .npmrc /nebula-web-console/
# Install any needed packages
RUN npm install
COPY . /nebula-web-console/
RUN npm run build && npm run tsc

FROM node:10-alpine
 # Make port available to the world outside this container

WORKDIR /nebula-web-console
COPY --from=builder ./nebula-web-console/package.json /nebula-web-console/
COPY .npmrc /nebula-web-console/
RUN npm install --production
COPY --from=builder /nebula-web-console/app /nebula-web-console/app
COPY --from=builder /nebula-web-console/config /nebula-web-console/config

EXPOSE 7001

CMD ["npm", "run", "docker-start"]
