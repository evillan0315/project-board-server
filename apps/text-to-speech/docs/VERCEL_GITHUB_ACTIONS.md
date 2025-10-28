# Vercel Deployment with GitHub Actions for Text-to-Speech Frontend

This document provides detailed instructions and explanations for deploying the `text-to-speech` frontend application to Vercel using an automated GitHub Actions workflow.

## 1. Vercel Configuration (`vercel.json`)

The `vercel.json` file, located at the root of the `apps/text-to-speech` directory, configures how Vercel builds and serves your frontend application. It also handles crucial API rewrites to direct backend calls.

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "${VERCEL_BACKEND_API_URL}/api/$1"
    }
  ]
}
```

### Explanation of `vercel.json`:

*   **`framework: "vite"`**: Specifies that the project is built using Vite. Vercel automatically detects and optimizes for Vite projects, but explicitly defining it ensures consistency.
*   **`buildCommand: "pnpm run build"`**: This is the command Vercel executes to build your application. It corresponds to the `build` script defined in your `package.json`.
*   **`outputDirectory: "dist"`**: After the build command runs, Vercel expects the static assets to be located in the `dist` directory, which is the default output for Vite builds.
*   **`rewrites`**: This is a critical configuration for monorepos and applications interacting with a separate backend. It tells Vercel's edge network to intercept and redirect requests based on defined rules.
    *   **`source: "/api/(.*)"`**: This rule matches any incoming request path that starts with `/api/`. The `(.*)` is a wildcard that captures the rest of the path.
    *   **`destination: "${VERCEL_BACKEND_API_URL}/api/$1"`**: When a request matches the `source`, Vercel rewrites it to this `destination`. 
        *   `${VERCEL_BACKEND_API_URL}`: This is an environment variable that **must be configured in your Vercel Project Settings** (and GitHub Actions secrets, as shown below). It should point to the base URL of your deployed backend API (e.g., `https://your-backend-api.com`).
        *   `/api/$1`: The captured part of the original source path (`$1`) is appended after `/api/` to the backend URL, ensuring the correct API endpoint is targeted (e.g., `/api/auth/login` becomes `https://your-backend-api.com/api/auth/login`).

This rewrite rule enables your frontend to make relative API calls (e.g., `axios.get('/api/auth/me')`) which Vercel then transparently forwards to your actual backend service, avoiding CORS issues and simplifying client-side API configuration.

## 2. GitHub Actions Workflow (`.github/workflows/deploy-vercel.yml`)

The GitHub Actions workflow automates the process of building and deploying the `text-to-speech` frontend to Vercel whenever changes are pushed or pull requests are opened against the `main` branch within the `apps/text-to-speech` directory.

```yaml
name: Deploy Text-to-Speech Frontend to Vercel

on:
  push:
    branches:
      - main
    paths:
      - 'apps/text-to-speech/**'
  pull_request:
    branches:
      - main
    paths:
      - 'apps/text-to-speech/**'

env:
  NODE_VERSION: '20'
  PNPM_CACHE_DIR: '~/.pnpm-store'

jobs:
  deploy-vercel:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./apps/text-to-speech

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ env.NODE_VERSION }} and pnpm
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          run_install: false

      - name: Get pnpm store directory
        id: pnpm-cache
        run: |
          echo "PNPM_STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: Cache pnpm modules
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.PNPM_STORE_PATH }}
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm run lint

      - name: Build project
        run: pnpm run build

      - name: Deploy to Vercel
        uses: vercel/action-deploy@v5
        with:
          token: ${{ secrets.VERCEL_TOKEN }}
          org-id: ${{ secrets.VERCEL_ORG_ID }}
          project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          # Set 'cwd' to the subdirectory containing your Vercel project (where vercel.json is)
          cwd: './apps/text-to-speech'
          # Pass the backend API URL as an environment variable for vercel.json rewrites
          env: |
            VERCEL_BACKEND_API_URL=${{ secrets.VERCEL_BACKEND_API_URL }}
```

### Explanation of the GitHub Actions Workflow:

*   **`name`**: A descriptive name for your workflow, visible in the GitHub Actions tab.

*   **`on`**: Defines when the workflow will run.
    *   `push` and `pull_request` on `main` branch trigger the workflow.
    *   `paths: - 'apps/text-to-speech/**'`: This is crucial for monorepos. The workflow only triggers if changes are made within the `apps/text-to-speech` directory, preventing unnecessary builds for other parts of the monorepo.

*   **`env`**: Defines environment variables available to all jobs and steps in the workflow.
    *   `NODE_VERSION`: Specifies the Node.js version to use.
    *   `PNPM_CACHE_DIR`: Sets the pnpm cache directory.

*   **`jobs.deploy-vercel`**: This is the main job responsible for deployment.
    *   **`runs-on: ubuntu-latest`**: The type of runner GitHub Actions will provision to execute the job.
    *   **`defaults.run.working-directory: ./apps/text-to-speech`**: **Extremely important for monorepos.** This sets the default working directory for all `run` commands within this job. All `pnpm` and other commands will be executed relative to `apps/text-to-speech`.

*   **`steps`**: A sequence of tasks to be executed within the `deploy-vercel` job.
    *   **`Checkout repository`**: Uses `actions/checkout@v4` to fetch your repository's code onto the runner.
    *   **`Setup Node.js ... and pnpm`**: Uses `actions/setup-node@v4` to install the specified Node.js version and configure pnpm caching.
    *   **`Setup pnpm`**: Uses `pnpm/action-setup@v3` to install pnpm itself, and `run_install: false` ensures `pnpm install` is run later to leverage caching.
    *   **`Get pnpm store directory` & `Cache pnpm modules`**: These steps set up caching for pnpm modules. Caching significantly speeds up subsequent workflow runs by reusing previously downloaded dependencies.
        *   `pnpm store path`: Determines where pnpm stores its global cache.
        *   `hashFiles('**/pnpm-lock.yaml')`: Generates a cache key based on the `pnpm-lock.yaml` file, invalidating the cache if dependencies change.
    *   **`Install dependencies`**: Runs `pnpm install --frozen-lockfile` to install project dependencies. `--frozen-lockfile` ensures that the `pnpm-lock.yaml` file is used as-is, preventing unintended dependency changes.
    *   **`Run ESLint`**: Executes the `lint` script from `package.json` to ensure code quality.
    *   **`Build project`**: Executes the `build` script from `package.json` to compile the application for production.
    *   **`Deploy to Vercel`**: This is the core deployment step, using the `vercel/action-deploy@v5` action.
        *   **`token: ${{ secrets.VERCEL_TOKEN }}`**: Your Vercel API token. This **must be stored as a GitHub Secret** (e.g., `VERCEL_TOKEN`) in your repository settings for security.
        *   **`org-id: ${{ secrets.VERCEL_ORG_ID }}`**: Your Vercel Organization ID. Also a **GitHub Secret**.
        *   **`project-id: ${{ secrets.VERCEL_PROJECT_ID }}`**: Your Vercel Project ID for the `text-to-speech` frontend. Also a **GitHub Secret**.
        *   **`cwd: './apps/text-to-speech'`**: Specifies that the Vercel deployment command should be run from within the `apps/text-to-speech` directory, where the `vercel.json` is located.
        *   **`env`**: Allows passing environment variables directly to the Vercel build environment. 
            *   `VERCEL_BACKEND_API_URL: ${{ secrets.VERCEL_BACKEND_API_URL }}`: This line passes the backend API URL (stored as a **GitHub Secret**) to the Vercel build. Vercel then uses this variable to resolve the `rewrites` destination in `vercel.json`.

### Secrets Management

To ensure this workflow functions correctly and securely, you need to configure the following secrets:

1.  **GitHub Repository Secrets**: Navigate to your GitHub repository settings -> `Secrets and variables` -> `Actions` and add the following new repository secrets:
    *   `VERCEL_TOKEN`: Your personal Vercel API token. Generate one from Vercel Dashboard -> Account -> Settings -> Tokens.
    *   `VERCEL_ORG_ID`: Found in your Vercel project settings under 'General' or 'Vercel Org ID' from the dashboard URL.
    *   `VERCEL_PROJECT_ID`: Found in your Vercel project settings under 'General' or the URL of your Vercel project.
    *   `VERCEL_BACKEND_API_URL`: The full URL to your deployed backend API (e.g., `https://api.yourdomain.com`). This will be used by the `vercel.json` rewrites.

2.  **Vercel Project Environment Variables**: In your Vercel Dashboard, go to your `text-to-speech` project settings -> `Environment Variables`. Add `VERCEL_BACKEND_API_URL` here as well, with the same value as your GitHub Secret. While the GitHub Action passes it to the *build environment*, Vercel itself also needs it configured for its runtime and rewrites to function correctly.

By following these steps, your `text-to-speech` frontend will be automatically built, linted, and deployed to Vercel whenever relevant changes are pushed to your `main` branch, ensuring a continuous and efficient deployment pipeline.
