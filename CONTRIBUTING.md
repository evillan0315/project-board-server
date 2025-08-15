# Contributing to ProBoard Module

Thank you for your interest in contributing to the **Auth Module** project! We welcome all contributions, including bug reports, feature requests, documentation improvements, and code submissions.
This guide will help you understand how to contribute and the standards we follow.

## Table of Contents
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [License](#license)
---

## Getting Started

1. **Fork the Repository**  
   Click the "Fork" button at the top-right of this page to create a copy of this repository under your GitHub account.

2. **Clone Your Fork**  
   ```bash
   git clone https://github.com/YOUR_USERNAME/auth-module.git
   cd auth-module
```

3. **Install Dependencies**
   Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

   ```bash
   pnpm install
   ```

4. **Run the Project Locally**
   Create your `.env` file and run:

   ```bash
   pnpm start:dev
   ```

## How to Contribute

* **Open an Issue** for bugs, enhancements, or questions.
* **Create a Pull Request (PR)** for code or documentation changes.
* For major changes or design proposals, please **open a discussion or issue first**.

## Code Style Guidelines

This project uses:

* **TypeScript** for all application code.
* **ESLint** and **Prettier** for consistent code formatting.
* **Conventional Commits** for commit messages.

Please follow the established architecture and patterns (e.g., modular design, separation of concerns, etc.) when adding or modifying features.

### Testing

If your change includes business logic, please add or update relevant unit and integration tests.

Run the tests with:

```bash
pnpm test
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Examples:

* `feat(auth): add GitHub OAuth support`
* `fix(session): resolve session expiry bug`
* `chore: update dependencies`
* `docs: improve contribution guidelines`

## Pull Request Process

1. Fork and clone the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit them.
4. Push to your fork: `git push origin feature/your-feature-name`.
5. Open a pull request against the `main` branch.

Ensure your PR:

* Is focused on a single topic.
* Includes tests for new logic.
* Passes all CI checks.

## Reporting Issues

If you find a bug or have a feature request:

* **Search existing issues** to avoid duplication.
* **Create a new issue** using the relevant template.
* Provide detailed steps to reproduce, expected behavior, and relevant logs or code snippets.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

We appreciate your effort and look forward to working with you!


