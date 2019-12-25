FROM golang:1.13.1
# Set the working directory to /app
WORKDIR /nebula-go-api
# Copy the current directory contents into the container at /app
ADD . /nebula-go-api
 # Make port available to the world outside this container
ENV GOPROXY https://goproxy.cn
RUN go build
EXPOSE 8080

CMD ["go", "run", "main.go"]
