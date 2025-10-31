# Deployment Guide

This document outlines the steps to deploy the `text-to-speech` frontend application. This guide focuses on general production deployment considerations. For specific CI/CD setups, refer to `VERCEL_GITHUB_ACTIONS.md` if applicable.

## 1. Building for Production

First, you need to build the optimized production bundle of your application.

```bash
pnpm run build
```

This command will:
*   Run TypeScript compilation (`tsc -b`).
*   Execute Vite's build process (`vite build`).
*   Output the production-ready static assets (HTML, CSS, JavaScript, images) into the `dist/` directory at the project root (`apps/text-to-speech/dist`).

## 2. Environment Variables for Production

Ensure your production environment has the correct environment variables. These are typically set on your hosting platform (e.g., Vercel, Netlify, Docker, Kubernetes).

*   `VITE_APP_API_BASE_URL`: **Crucial.** This must be the public URL of your deployed backend server (e.g., `https://your-backend-api.com/api`).
*   `VITE_FRONTEND_PORT`: The port your frontend application will be served from (e.g., `80` or `443` for public web servers). This is primarily used by the backend for OAuth callback URLs during the login process.
*   `VITE_BASE_DIR`: **Crucial for AI Code Planner.** This is the **absolute path** to the `text-to-speech` project root on the machine where the backend is running. This is typically only relevant if your backend application is deployed on a server that has direct access to the `text-to-speech` project's files (e.g., in a development or local server setup, or a very specific monorepo deployment strategy). In most standard production deployments, the frontend and backend are separate, and the backend would *not* have direct access to the frontend's local files. For typical production, you might need to reconsider how the AI Planner applies changes or provide a different mechanism if direct file system access isn't feasible or desired. **For standard frontend deployments, this variable often won't be used by the frontend itself, but the backend still requires it to apply plans.**

**Example `.env` (production values):**

```env
VITE_APP_API_BASE_URL=https://your-backend-api.com/api
VITE_FRONTEND_PORT=443 # Or 80 for HTTP
# VITE_BASE_DIR might be omitted on frontend production builds,
# or set to a relevant path if the frontend is deployed alongside a backend that needs it.
# For standalone frontend deployments, this variable is only for the backend's context.
```

**Backend OAuth Configuration for Production:**

Just like in development, ensure your backend's `.env` or configuration for production sets the OAuth callback URLs to your deployed frontend's URL:

```env
# ... other backend configs
GOOGLE_CALLBACK_URL='https://your-frontend-app.com/auth/callback'
GITHUB_CALLBACK_URL='https://your-frontend-app.com/auth/callback'
FRONTEND_URL='https://your-frontend-app.com'
```

## 3. Serving the Frontend

The `dist/` directory contains static assets that can be served by any static file server (e.g., Nginx, Apache, Vercel, Netlify, Cloudflare Pages, Firebase Hosting).

### 3.1 Using a Simple HTTP Server (for testing production build)

You can locally test your production build using a simple HTTP server (like `serve`).

1.  **Install `serve` globally (if you don't have it):**
    ```bash
    pnpm add -g serve
    # or npm install -g serve
    ```
2.  **Serve the `dist` directory:**
    ```bash
    serve -s dist -l 3003
    ```
    This will serve your application from `http://localhost:3003`.

### 3.2 Using Nginx

For a production web server like Nginx, you would configure a server block to serve the static files.

Example Nginx configuration (replace `your-frontend-app.com` and `/path/to/your/app/dist`):

```nginx
server {
    listen 80;
    server_name your-frontend-app.com;

    location / {
        root /path/to/your/app/dist; # Absolute path to your `dist` folder
        try_files $uri $uri/ /index.html; # Essential for SPA routing
    }

    # Optional: Proxy API requests to your backend
    location /api/ {
        proxy_pass http://localhost:5000/; # Adjust to your backend's actual address
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: SSL configuration
    # listen 443 ssl;
    # ssl_certificate /etc/nginx/ssl/your-frontend-app.com.crt;
    # ssl_certificate_key /etc/nginx/ssl/your-frontend-app.com.key;
}
```

### 3.3 Cloud Hosting Platforms (Vercel, Netlify, etc.)

These platforms are ideal for deploying Vite SPAs.

1.  **Connect Repository:** Link your GitHub/GitLab/Bitbucket repository to your chosen platform.
2.  **Build Command:** Configure the build command as `pnpm run build` (or `npm run build` / `yarn build`).
3.  **Output Directory:** Set the output directory to `dist/`.
4.  **Environment Variables:** Set your production `VITE_APP_API_BASE_URL` and `VITE_FRONTEND_PORT` (if required by the backend's OAuth callback logic) in the platform's settings.
5.  **Deployment:** The platform will automatically build and deploy your application on every push to your main branch.

### 3.4 Docker

You can containerize your frontend application using Docker. A `Dockerfile` is provided in the project root.

1.  **Build the Docker image:**
    ```bash
    docker build -t text-to-speech-frontend .
    ```
2.  **Run the Docker container:**
    ```bash
    docker run -p 3003:80 text-to-speech-frontend
    ```
    This will map container port 80 to host port 3003. You can then access the application at `http://localhost:3003`.

    **Note**: You'll need to pass environment variables to the container (e.g., `VITE_APP_API_BASE_URL`) using `-e` flags in the `docker run` command or by defining them in a `.env` file for Docker Compose.

## 4. Kubernetes Deployment

Refer to the `kubernetes/` folder for example Kubernetes deployment and service configurations for the frontend. These typically involve:
*   **Deployment**: Specifying the Docker image, replica count, and resource requests/limits.
*   **Service**: Defining how to expose the frontend (e.g., ClusterIP, NodePort, LoadBalancer).
*   **Ingress**: (Optional) For external access and routing, often combined with an Ingress Controller (like Nginx Ingress).

Example `kubernetes/deployment.yaml` snippet (ensure image name and environment variables are updated):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: text-to-speech-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: text-to-speech-frontend
  template:
    metadata:
      labels:
        app: text-to-speech-frontend
    spec:
      containers:
        - name: frontend
          image: your-docker-registry/text-to-speech-frontend:latest # Update with your image
          ports:
            - containerPort: 80 # The port your Nginx/server inside Docker listens on
          env:
            - name: VITE_APP_API_BASE_URL
              value: "https://your-backend-api.com/api" # Production API URL
            # Add other necessary VITE_ variables here
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "250m"
              memory: "256Mi"
```

Remember to update `VITE_APP_API_BASE_URL` and other environment variables in your Kubernetes manifest.
