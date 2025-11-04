FROM node:22

WORKDIR /app

ARG NODE_ENV=production
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL

ENV NODE_ENV=${NODE_ENV}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent
RUN npm install -g serve

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build"]
