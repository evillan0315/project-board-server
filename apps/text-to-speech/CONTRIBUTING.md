# Contributing to Google Gemini TTS Generator Frontend

We welcome contributions to the Google Gemini TTS Generator Frontend! By contributing, you're helping us improve and expand this application. Please take a moment to review this document to understand how to contribute effectively.

## Table of Contents

1.  [Code of Conduct](#code-of-conduct)
2.  [Getting Started](#getting-started)
3.  [Development Setup](#development-setup)
4.  [Code Style and Quality](#code-style-and-quality)
5.  [Testing](#testing)
6.  [Commit Messages](#commit-messages)
7.  [Pull Request Process](#pull-request-process)
8.  [Reporting Issues](#reporting-issues)
9.  [Asking Questions](#asking-questions)
10. [Further Documentation](#further-documentation)

## 1. Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please review our [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) (or link to your project's specific one if available).

## 2. Getting Started

If you're new to the project, start by familiarizing yourself with the application's purpose, features, and overall architecture. The [README.md](README.md) provides a good overview.

## 3. Development Setup

To get the project up and running on your local machine, please follow the detailed instructions in the main [README.md](README.md) under the "Getting Started" section. This includes:

*   **Prerequisites**: Node.js (v18+), pnpm.
*   **Installation**: Cloning the repository, installing dependencies with `pnpm install`.
*   **Configuration**: Setting up your `.env` file for API base URLs and OAuth callbacks.
*   **Running the Application**: `pnpm run dev`.

Ensure you have the corresponding backend server (`project-board-server`) running and accessible as described in the `README.md`.

## 4. Code Style and Quality

We maintain a consistent code style and quality across the project. Please ensure your contributions adhere to these standards.

*   **TypeScript**: All new code should be written in TypeScript, ensuring strong typing.
*   **ESLint**: We use ESLint for static code analysis. Your code must pass ESLint checks.
    *   You can run `pnpm run lint` to check for issues.
    *   To automatically fix some issues, run `pnpm run lint:fix`.
*   **Prettier**: We use Prettier for code formatting. Code must be formatted using Prettier.
    *   You can run `pnpm run format` to automatically format your code.
*   **Material UI & Tailwind CSS**: For UI components, follow the Material UI v6 guidelines and use Tailwind CSS v4 for utility-first styling and layout. Prefer `sx` prop for Material UI specific styling definitions (defined as constants at the top of the file) and Tailwind classes for general layout and responsiveness.
*   **React Best Practices**: Functional components, hooks, and nanostores for state management where appropriate.

## 5. Testing

*(Note: Currently, there are no dedicated unit or integration tests configured for this frontend. If you'd like to contribute testing infrastructure, please open an issue to discuss!)*

For now, please ensure your changes are thoroughly tested manually within the browser across different scenarios.

## 6. Commit Messages

We encourage using [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for clear and consistent commit history. This helps in generating changelogs and understanding the nature of changes.

Examples:

*   `feat: add new speaker configuration options`
*   `fix: resolve audio playback issue on Safari`
*   `docs: update README with new setup steps`
*   `chore: update dependencies`

## 7. Pull Request Process

1.  **Fork** the `project-board-server` repository on GitHub.
2.  **Clone** your forked repository locally.
3.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/issue-description`.
4.  **Make your changes** in the `apps/text-to-speech` directory.
5.  **Commit your changes** following the Conventional Commits guidelines.
6.  **Push your branch** to your forked repository: `git push origin feature/your-feature-name`.
7.  **Open a Pull Request** (PR) from your branch to the `main` branch of the original `project-board-server` repository.
    *   Provide a clear and concise title and description for your PR.
    *   Explain the problem your PR solves or the feature it adds.
    *   Mention any related issues.
    *   Include screenshots or GIFs for UI changes if applicable.
8.  **Address Feedback**: Be prepared to discuss and incorporate feedback from reviewers.

## 8. Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/evillan0315/project-board-server/issues) on the main `project-board-server` GitHub repository.

*   **Bug Reports**: Provide a clear title, detailed steps to reproduce, expected behavior, actual behavior, and your environment (browser, OS, etc.).
*   **Feature Requests**: Describe the feature, its use case, and why it would be valuable.

## 9. Asking Questions

For general questions or discussions, please use the GitHub Discussions feature (if enabled) or reach out via the contact information in the `README.md`.

## 10. Further Documentation

For more in-depth information on the project's architecture, specific coding standards, and design decisions, please refer to the [Developer Guide](docs/DEVELOPER_GUIDE.md).
