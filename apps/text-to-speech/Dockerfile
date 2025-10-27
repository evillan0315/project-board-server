# Stage 1: Build the React application
FROM node:22-alpine as build-stage

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy pnpm-lock.yaml and package.json to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application for production
# VITE_APP_API_BASE_URL and VITE_FRONTEND_PORT are primarily for Vite's dev server proxying
# or for the frontend to construct OAuth callback parameters. For production deployment,
# Nginx will handle the /api proxying, and the backend will construct the full OAuth callback
# URLs based on its own 'FRONTEND_URL' configuration. Thus, these are not typically needed
# to be explicitly defined during the frontend's production build. If they were still used
# within the frontend JS (e.g., for direct axios calls outside of the /api prefix, which is not
# the case here as services use '/api'), they would need to be passed during 'vite build' as --define.
RUN pnpm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine as production-stage

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React application from the build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to run Nginx (default command for nginx:alpine)
CMD ["nginx", "-g", "daemon off;"]
