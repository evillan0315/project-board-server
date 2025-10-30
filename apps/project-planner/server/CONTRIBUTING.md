# Contributing to Project Planner Server

We welcome contributions to the Project Planner Server! Please take a moment to review this document to ensure a smooth and effective contribution process.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms. (Note: A CODE_OF_CONDUCT.md is not yet provided but is good practice to include).

## How to Contribute

### 1. Fork the Repository

First, fork the [project-planner-server repository](https://github.com/your-username/project-planner-server) to your own GitHub account.

### 2. Clone Your Fork

```bash
git clone https://github.com/your-username/project-planner-server.git
cd project-planner-server
```

### 3. Create a New Branch

Create a new branch for your feature or bug fix. Use a descriptive name:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
```

### 4. Set up Your Development Environment

Follow the [installation instructions in the README.md](README.md#getting-started) to set up your local development environment, including database setup and `.env` configuration.

### 5. Make Your Changes

-   Implement your feature or fix your bug.
-   Write clear, concise, and idiomatic TypeScript code.
-   Ensure your code adheres to existing coding styles.
-   If you add new features, consider adding relevant tests (e.g., unit tests for services, integration tests for routes). Though no explicit testing framework is set up in the provided context, it's a good practice for future.

### 6. Code Style and Linting

This project uses ESLint and Prettier for code consistency. Before committing, ensure your code passes lint checks and is properly formatted:

```bash
npm run lint
npm run format
```

### 7. Commit Your Changes

Write clear and descriptive commit messages. A good commit message should explain *what* you changed and *why*.

```bash
git add .
git commit -m "feat: Add new awesome feature"
# or
git commit -m "fix: Resolve critical bug in auth service"
```

### 8. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 9. Create a Pull Request

-   Go to the original `project-planner-server` repository on GitHub.
-   You should see a prompt to create a new pull request from your recently pushed branch.
-   Provide a clear title and description for your pull request.
    -   Explain the purpose of your changes.
    -   Reference any relevant issues.
    -   Include screenshots or examples if your changes affect the UI or user experience (if applicable for a backend change).
-   Submit your pull request.

## Code Review Process

-   Your pull request will be reviewed by maintainers.
-   Be prepared to respond to feedback and make further changes if requested.
-   Once approved, your changes will be merged into the main branch.

Thank you for contributing to Project Planner Server!