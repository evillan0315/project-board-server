 ## Building the Docker Image

To build the Docker image for the Codejector frontend, you need to execute the `docker build` command from the root of the project (`codejector/`). The `Dockerfile` is configured to use several build arguments (`--build-arg`) which correspond to the environment variables required by the Vite build process.

These variables are typically defined in your `.env` file. It's recommended to populate these values from your `.env` file to ensure consistency with your development and deployment configurations.

#### 1. Ensure your `.env` file is set up

Make sure your `.env` file in the project root (`codejector/.env`) contains all the necessary variables, such as:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_FRONTEND_URL=http://localhost:3001
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
VITE_BACKEND_URL=http://localhost:3000
VITE_SLS_API_URL=http://localhost:4000
VITE_SLS_VIDU_URL=https://localhost:8443
VITE_SLS_API_KEY=MY_SLS_KEY
VITE_SLS_USERNAME=openvidu
VITE_SLS_WS_URL=wss://localhost:8443
```

**Note**: Replace placeholder values like `MY_SLS_KEY` with your actual credentials. For production, consider using a more secure method for injecting secrets (e.g., Docker secrets, Kubernetes secrets).

#### 2. Build the Docker Image

Navigate to the `codejector` directory (where your `Dockerfile` and `package.json` are located) and run the following command. This command leverages a small `bash` script to dynamically load variables from your `.env` file and pass them as `--build-arg`s to Docker.

```bash
#!/bin/bash

# Source the .env file to load variables
if [ -f ./.env ]; then
  export $(grep -v '^#' ./.env | xargs)
else
  echo ".env file not found. Please create one with the required environment variables."
  exit 1
fi

# Execute the Docker build command
docker build \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  --build-arg VITE_WS_URL="$VITE_WS_URL" \
  --build-arg VITE_FRONTEND_URL="$VITE_FRONTEND_URL" \
  --build-arg GITHUB_CALLBACK_URL="$GITHUB_CALLBACK_URL" \
  --build-arg GOOGLE_CALLBACK_URL="$GOOGLE_CALLBACK_URL" \
  --build-arg VITE_BACKEND_URL="$VITE_BACKEND_URL" \
  --build-arg VITE_SLS_API_URL="$VITE_SLS_API_URL" \
  --build-arg VITE_SLS_VIDU_URL="$VITE_SLS_VIDU_URL" \
  --build-arg VITE_SLS_API_KEY="$VITE_SLS_API_KEY" \
  --build-arg VITE_SLS_USERNAME="$VITE_SLS_USERNAME" \
  --build-arg VITE_SLS_WS_URL="$VITE_SLS_WS_URL" \
  --build-arg NODE_ENV="$NODE_ENV" \
  -t codejector-frontend:latest .
```

**Explanation of the command:**
- `#!/bin/bash`: Shebang to indicate a bash script.
- `if [ -f ./.env ]; then ... fi`: Checks if a `.env` file exists.
- `export $(grep -v '^#' ./.env | xargs)`: Reads variables from `.env` (excluding comments and empty lines) and exports them as shell environment variables. This makes them accessible for interpolation in the `docker build` command.
- `--build-arg <VAR_NAME>="$VAR_VALUE"`: Passes each environment variable from your `.env` file as a build argument to the Dockerfile.
- `-t codejector-frontend:latest`: Tags the resulting Docker image with the name `codejector-frontend` and the `latest` tag.
- `.`: Specifies the build context (the current directory, where the `Dockerfile` is located).

#### 3. Run the Docker Image (Optional)

After successfully building the image, you can run it using Docker:

```bash
docker run -d -p 80:80 --name codejector-app codejector-frontend:latest
```

This will start the Nginx server inside the container, mapping port 80 of the container to port 80 on your host machine. You can then access the application in your browser at `http://localhost`.