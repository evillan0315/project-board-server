ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_FRONTEND_URL
ARG GITHUB_CALLBACK_URL
ARG GOOGLE_CALLBACK_URL
ARG VITE_BACKEND_URL
ARG VITE_SLS_API_URL
ARG VITE_SLS_VIDU_URL
ARG VITE_SLS_API_KEY
ARG VITE_SLS_USERNAME
ARG VITE_SLS_WS_URL
ARG NODE_ENV
# Stage 1: Build the React application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
# RUN npm install -g yarn

# Copy package.json and yarn.lock (if pnpm respects it, or for cache invalidation)
# The project context has yarn.lock, but README.md states 'pnpm install'
COPY package.json yarn.lock ./ 

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Set environment variables for the build process
# Vite will pick these up via `process.env` when `loadEnv` is called explicitly or implicitly.
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_FRONTEND_URL=${VITE_FRONTEND_URL}
ENV GITHUB_CALLBACK_URL=${GITHUB_CALLBACK_URL}
ENV GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL}
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_SLS_API_URL=${VITE_SLS_API_URL}
ENV VITE_SLS_VIDU_URL=${VITE_SLS_VIDU_URL}
ENV VITE_SLS_API_KEY=${VITE_SLS_API_KEY}
ENV VITE_SLS_USERNAME=${VITE_SLS_USERNAME}
ENV VITE_SLS_WS_URL=${VITE_SLS_WS_URL}
ENV NODE_ENV=production

# Build the application
RUN yarn run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
