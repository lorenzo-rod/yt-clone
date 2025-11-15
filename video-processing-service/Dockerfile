# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages specified in package.json
RUN apt-get update && apt-get install -y ffmpeg

# Install Node.js dependencies
RUN npm install

# Copy app source code inside the docker image
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run the app (uses CMD, there is only one CMD allowed per Dockerfile)
CMD ["npm", "start"]