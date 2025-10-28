# Deployment Guide: Docker and Kubernetes for Text-to-Speech Frontend

This document outlines how to containerize the `text-to-speech` frontend application using Docker and deploy it to a Kubernetes cluster.

**For Vercel-specific deployments using GitHub Actions, please refer to the [Vercel Deployment Guide](VERCEL_GITHUB_ACTIONS.md).**

## 1. Dockerization

### Overview

The application is Dockerized using a multi-stage build `Dockerfile`. This approach separates the build environment from the runtime environment, resulting in a smaller, more secure final image. Nginx is used to serve the static React application and proxy API requests to the backend.

### `Dockerfile` Explanation

```dockerfile
# Stage 1: Build the React application
FROM node:22-alpine as build-stage
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine as production-stage
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Key Points:**

*   **`build-stage`**: Uses `node:22-alpine` to install `pnpm`, dependencies, and build the React application. The output (static files) is placed in `/app/dist`.
*   **`production-stage`**: Uses a lightweight `nginx:alpine` image. It copies a custom `nginx.conf` and the built static assets from the `build-stage` into Nginx's serving directory (`/usr/share/nginx/html`).
*   **`EXPOSE 80`**: Indicates that the container listens on port 80.
*   **`CMD ["nginx", "-g", "daemon off;"]`**: Starts the Nginx server in the foreground.

### `nginx.conf` Explanation

```nginx
server {
    listen 80;
    server_tokens off;
    root /usr/share/nginx/html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass $API_BASE_URL;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location ~ /\. {
        deny all;
    }
}
```

**Key Points:**

*   **`listen 80`**: Nginx listens for HTTP requests on port 80.
*   **`root /usr/share/nginx/html`**: Specifies the directory where static files (your built React app) are located.
*   **`location /`**: Configures Nginx to serve `index.html` for all non-existent paths, which is essential for client-side routing in single-page applications (SPAs).
*   **`location /api/`**: This is crucial for backend communication. Any request starting with `/api/` is proxied to the `API_BASE_URL`. This `API_BASE_URL` is expected to be provided as an environment variable to the Nginx container (e.g., via Kubernetes Deployment or Docker run command). This ensures that frontend calls like `/api/auth/login` are correctly routed to the backend.
*   **`proxy_set_header`**: These headers are important for the backend to correctly identify the client's IP, host, and protocol.
*   **`location ~ /\. `**: Denies access to dotfiles (e.g., `.env`, `.git`).

### Building the Docker Image

To build the Docker image, navigate to the `text-to-speech` directory (where the `Dockerfile` is located) and run:

```bash
docker build -t text-to-speech-frontend:latest .
```

### Running the Docker Image Locally

You can test the Docker image locally. Remember to set the `API_BASE_URL` environment variable so Nginx can proxy requests to your backend (which should be running separately, e.g., on `http://localhost:3000`).

```bash
docker run -p 80:80 -e API_BASE_URL="http://host.docker.internal:3000/api" text-to-speech-frontend:latest
```

*   `-p 80:80`: Maps container port 80 to host port 80.
*   `-e API_BASE_URL="http://host.docker.internal:3000/api"`: Sets the `API_BASE_URL` environment variable inside the container. `host.docker.internal` is a special DNS name for Docker Desktop that resolves to the host's IP address. Adjust the port (`3000`) and path (`/api`) to match your backend service.

Now, you should be able to access the frontend at `http://localhost`.

## 2. Kubernetes Deployment

### Overview

The Kubernetes deployment consists of two main resources:

1.  **Deployment**: Manages the stateless frontend application pods.
2.  **Service**: Exposes the frontend application internally within the Kubernetes cluster.

These configurations are located in the `kubernetes/` directory.

### `kubernetes/deployment.yaml` Explanation

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: text-to-speech-frontend
  labels:
    app: text-to-speech-frontend
spec:
  replicas: 2
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
        image: text-to-speech-frontend:latest # TODO: Replace with your actual image registry and tag
        ports:
        - containerPort: 80
        env:
        - name: API_BASE_URL
          value: "http://project-board-server-backend:5000" # TODO: Replace with your backend service details
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

**Key Points:**

*   **`metadata.name`**: Unique name for the deployment.
*   **`spec.replicas: 2`**: Ensures that two instances (pods) of your frontend application are running for high availability.
*   **`spec.selector`**: Defines how the Deployment finds which pods to manage.
*   **`spec.template.spec.containers[0].image`**: Specifies the Docker image to use. **Crucially, you must replace `text-to-speech-frontend:latest` with the path to your image in a Docker registry (e.g., `your-docker-registry/text-to-speech-frontend:v1.0.0`) after pushing your built image.**
*   **`spec.template.spec.containers[0].ports[0].containerPort: 80`**: The container listens on port 80, as configured in Nginx.
*   **`spec.template.spec.containers[0].env[0].name: API_BASE_URL`**: This environment variable is passed to the Nginx container, allowing Nginx to proxy `/api` requests to the correct backend service within the Kubernetes cluster. The `value` `http://project-board-server-backend:5000` assumes your backend service is named `project-board-server-backend` and listens on port `5000` (which is a common port for NestJS applications).
*   **`resources`**: Defines CPU and memory requests and limits for the container, helping Kubernetes schedule and manage resources effectively.

### `kubernetes/service.yaml` Explanation

```yaml
apiVersion: v1
kind: Service
metadata:
  name: text-to-speech-frontend-service
  labels:
    app: text-to-speech-frontend
spec:
  selector:
    app: text-to-speech-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
```

**Key Points:**

*   **`metadata.name`**: Unique name for the service.
*   **`spec.selector`**: Matches pods with the label `app: text-to-speech-frontend`, directing traffic to them.
*   **`spec.ports`**: Configures the service to listen on `port: 80` and forward traffic to `targetPort: 80` on the pods.
*   **`type: ClusterIP`**: Makes the service only reachable from within the Kubernetes cluster. For external access, you would typically use an Ingress controller configured with an Ingress resource.

### Applying to Kubernetes

After building and pushing your Docker image to a registry (and updating the `deployment.yaml` with the correct image path), you can apply these configurations to your Kubernetes cluster:

```bash
# Apply the deployment
kubectl apply -f kubernetes/deployment.yaml

# Apply the service
kubectl apply -f kubernetes/service.yaml
```

### Verification

Check the status of your deployment and service:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

To access the frontend externally, you would need an Ingress resource that routes external traffic to the `text-to-speech-frontend-service`.
