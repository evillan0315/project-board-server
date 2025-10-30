# Contributing to Project Planner

We welcome contributions to the Project Planner project! Whether it's reporting a bug, suggesting a new feature, or submitting code changes, your help is greatly appreciated.

Please take a moment to review this document before making any contributions.

## Code of Conduct

We expect all contributors to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) (if applicable).

## How to Contribute

### Bug Reports

If you find a bug, please open an issue on our GitHub repository. When reporting a bug, please include:

*   A clear and concise description of the bug.
*   Steps to reproduce the behavior.
*   Expected behavior.
*   Actual behavior.
*   Screenshots or error messages (if applicable).
*   Your operating system, Node.js version, and any other relevant environment details.

### Feature Requests

We love new ideas! If you have a feature request, please open an issue and:

*   Provide a clear and concise description of the desired feature.
*   Explain why this feature would be valuable to the project.
*   Describe any potential alternatives you've considered.

### Pull Requests

1.  **Fork the repository** and clone it to your local machine.
2.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b bugfix/issue-description
    ```
3.  **Make your changes** in the `frontend` or `server` directory as appropriate.
4.  **Test your changes**: Ensure that your changes work as expected and don't introduce new issues.
    *   For backend changes, ensure all `npm run lint` and `npm run build` commands pass.
    *   For frontend changes, ensure the application runs without errors.
5.  **Commit your changes** with a clear and descriptive commit message. Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines (e.g., `feat: add new user dashboard`, `fix: correct login redirect`).
6.  **Push your branch** to your forked repository.
7.  **Open a Pull Request** against the `main` branch of the original repository.
    *   Provide a clear title and description for your PR.
    *   Reference any related issues (e.g., `Closes #123`, `Fixes #456`).
    *   Describe the changes you've made and why.

### Code Style

*   Ensure your code adheres to the existing coding style of the project.
*   Run `npm run format` in the `server` directory to auto-format your code.
*   Run `npm run lint` in the `server` directory to check for linting errors.
*   For TypeScript, ensure full type safety and avoid `any` where possible.

### Testing

*   If you're adding new features or fixing bugs, consider adding unit or integration tests to cover your changes, if the project has an established testing framework.

Thank you for contributing to Project Planner!
