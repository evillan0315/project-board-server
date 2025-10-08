# Contributing to Project Board Frontend

We welcome contributions to the Project Board Frontend project! Please follow these guidelines when contributing.

## Code of Conduct

Please note that this project has a Code of Conduct. By participating in this project, you agree to abide by its terms.

## How to Contribute

### Reporting Issues


If you find a bug or have a feature request, please submit an issue using the [issue tracker](https://github.com/evillan0315/project-board-front/issues).

*   Clearly describe the issue, including steps to reproduce it if possible.
*   Specify the environment in which you encountered the issue (e.g., browser, operating system).

### Submitting Pull Requests (PRs)

1.  Fork the repository.
2.  Create a new branch for your changes (see Branching Strategy below).
3.  Make your changes, following the coding standards.
4.  Test your changes thoroughly.
5.  Commit your changes with clear, concise messages.
6.  Push your branch to your forked repository.
7.  Submit a pull request to the `main` branch of the original repository.

### Branching Strategy

We recommend a feature-branch workflow. All new features, bug fixes, or improvements should be developed on a dedicated branch created from `main` (or `develop` if applicable).

1.  **Update your local `main` branch:**

    ```bash
git checkout main
git pull origin main
    ```

2.  **Create a new feature branch:**

    ```bash
git checkout -b feature/your-feature-name
# or for bug fixes:
git checkout -b bugfix/issue-description
    ```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for commit messages. This helps automate the release process and provides better context for changes.

*   Use the imperative mood (e.g., "Add feature" instead of "Added feature").
*   Start with a type (feat, fix, docs, chore, style, refactor, test, build, ci, perf).
*   Example: `feat: Add new user authentication component`
*   Example: `fix: Resolve navigation issue in Navbar`

### Making Changes and Committing

As you make changes, frequently stage and commit your work with clear, concise messages.

1.  **Check your current changes:**

    ```bash
git status
    ```

2.  **Stage your changes (add files to the staging area):**

    ```bash
git add .
# or to add specific files:
git add src/path/to/your/file.ts src/other/file.tsx
    ```

3.  **Commit your staged changes:**

    ```bash
git commit -m 'feat: Add new user authentication component'
# or for a bug fix:
git commit -m 'fix: Resolve navigation issue in Navbar'
# Use imperative mood, start with type (feat, fix, docs, chore, style, refactor, test, build, ci, perf)
    ```

4.  **Push your branch to the remote repository:**

    ```bash
git push origin feature/your-feature-name
    ```

### Code Style

This project uses ESLint and Prettier to enforce code style. Please ensure your code passes all linting checks before submitting a pull request.

*   Run `pnpm lint` to check for linting errors.
*   Run `pnpm lint:fix` to automatically fix some linting errors.
*   Run `pnpm format` to format your code with Prettier.

### Testing

Write tests for your changes to ensure they are working correctly and do not introduce regressions.

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
