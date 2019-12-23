FROM node:10
# Set the working directory to /app
WORKDIR /nebula-web-console
# Copy the current directory contents into the container at /app
ADD . /nebula-web-console
# Install any needed packages
RUN npm install
RUN npm run build
RUN npm run tsc
 # Make port available to the world outside this container
EXPOSE 7001

CMD ["npm", "run", "docker-start"]
