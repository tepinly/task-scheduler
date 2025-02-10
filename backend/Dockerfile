# Use the official Node.js image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to install dependencies
COPY package*.json ./

# Install dependencies using npm
RUN npm install

# Copy all project files to the container
COPY . .

# Build TypeScript files using tsc
RUN npm run build

# Expose the port you want your app to run on
EXPOSE 3000

# Command to run the backend (after tsc build)
CMD ["npm", "run", "dev"]
