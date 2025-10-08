# Contributing to API Builder

We welcome contributions to the API Builder! Whether it's reporting a bug, suggesting an enhancement, or submitting a code change, your help is valuable.

Please take a moment to review this document to make the contribution process as smooth as possible.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project, you agree to abide by its terms. (A Code of Conduct file would typically be linked here, e.g., `CODE_OF_CONDUCT.md`).

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please open an issue on GitHub. When reporting a bug, please:

1.  **Check existing issues** to see if the bug has already been reported.
2.  **Provide clear steps to reproduce** the bug.
3.  **Include your environment details**: OS, Node.js version, npm/yarn version.
4.  **Share any relevant error messages or console output**.

### Suggesting Enhancements

We're always looking for ways to improve the API Builder. If you have an idea for a new feature or an improvement to existing functionality, please open an issue. When suggesting an enhancement, please:

1.  **Clearly describe the feature/enhancement** and its purpose.
2.  **Explain why it would be useful** for other users.
3.  **Provide examples** where applicable.

### Submitting Code Changes

We appreciate code contributions! To submit a change:

1.  **Fork the repository** on GitHub.
2.  **Clone your forked repository** to your local machine.
3.  **Create a new branch** for your changes:
    ```bash
    git checkout -b feature/your-feature-name-or-fix/issue-number
    ```
4.  **Set up the development environment**:

    ```bash
    # Install dependencies
    npm install # or yarn install

    # Start the development server
    npm run dev # The API will be available at http://localhost:3003
    ```

5.  **Make your changes**. Ensure your code adheres to the existing coding style (ESLint is configured for this project).
    - If you add a new schema or modify an existing one, verify it with `curl` commands.
    - If you add new API endpoints, consider adding examples to `README.md`.
6.  **Run tests** (if any exist, for this project, you'd manually test with `curl` or create integration tests).
    - Currently, there are no automated tests. If you're adding significant functionality, please consider adding tests or at least documenting manual testing steps.
7.  **Commit your changes**. Please use clear and descriptive commit messages. A good commit message explains *what* changed and *why*.
    ```bash
    git commit -m "feat: Add new feature"
    # or
    git commit -m "fix: Resolve bug in schema validation (#123)"
    ```
8.  **Push your branch** to your forked repository:
    ```bash
    git push origin feature/your-feature-name
    ```
9.  **Open a Pull Request** (PR) from your forked repository to the `main` branch of the original repository.
    - Provide a clear title and description for your PR.
    - Reference any related issues (e.g., "Closes #123").

## Development Setup

The project uses:
- Node.js
- TypeScript
- Express.js
- AJV for JSON schema validation
- ESLint for code linting

The `package.json` contains scripts for building (`npm run build`) and running in development mode (`npm run dev`).

Thank you for contributing!
