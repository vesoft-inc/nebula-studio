FROM node:10-alpine as builder
# Set the working directory to /app
WORKDIR /nebula-graph-studio
# Copy the current directory contents into the container at /app
COPY package.json /nebula-graph-studio/
COPY .npmrc /nebula-graph-studio/
# Install any needed packages
RUN npm install
COPY . /nebula-graph-studio/

# build and remove front source code
RUN npm run build && npm run tsc && rm -rf app/assets/*
COPY ./app/assets/index.html  /nebula-graph-studio/app/assets/

FROM node:10-alpine
 # Make port available to the world outside this container

WORKDIR /nebula-graph-studio
COPY --from=builder ./nebula-graph-studio/package.json /nebula-graph-studio/
COPY .npmrc /nebula-graph-studio/
COPY --from=builder /nebula-graph-studio/app /nebula-graph-studio/app
COPY --from=builder /nebula-graph-studio/favicon.ico /nebula-graph-studio/favicon.ico
COPY --from=builder /nebula-graph-studio/config /nebula-graph-studio/config
RUN npm install --production

EXPOSE 7001

CMD ["npm", "run", "docker-start"]
