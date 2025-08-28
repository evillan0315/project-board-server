# 🚀 AI Editor Frontend

[![License](https://img.shields.io/github/license/your-username/your-repo)](LICENSE)
[![Issues](https://img.shields.io/github/issues/your-username/your-repo)](https://github.com/your-username/your-repo/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/your-username/your-repo)](https://github.com/your-username/your-repo/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/your-username/your-repo)](https://github.com/your-username/your-repo/commits)

> A React frontend for the AI Editor backend, built with Vite, React, Nanostores, Tailwind CSS, and Material-UI.

---

## 📖 Table of Contents

- [Features](#-features)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)
- [Contact](#-contact)

---

## ✨ Features

- ⚡ AI-powered file modification and generation
- 🔒 Secure authentication with Google & GitHub OAuth2
- 🌍 Responsive UI with Tailwind CSS and Material-UI
- 📂 File system browsing and diff visualization

---

## 📂 Project Structure

```bash
apps/ai-editor-front/
├── src/              # Source code
├── docs/             # Documentation
├── tests/            # Unit and integration tests
├── .env.example      # Example environment variables
├── package.json      # Dependencies & scripts
└── README.md         # Project documentation
```

---

## 📋 Requirements

- Node.js >= 18
- AI Editor Backend (running)

---

## 🛠️ Installation

```bash
# Navigate to the project root and then to this app
cd full-stack/apps/ai-editor-front

# Install dependencies
pnpm install # or npm install / yarn install
```

---

## ⚙️ Usage

```bash
# Development server
pnpm run dev

# Build for production
pnpm run build

# Start production build
pnpm run preview
```

---

## 📖 API Reference

Refer to the main `ai-editor` backend documentation for API details.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory of `apps/ai-editor-front`.

```ini
VITE_API_URL=http://localhost:3000 # Or wherever your backend API is running
VITE_FRONTEND_URL=http://localhost:3001 # Or your deployed frontend URL
VITE_BASE_DIR=/path/to/your/project/root # Example: /media/eddie/Data/projects/nestJS/nest-modules/full-stack/apps/ai-editor
GITHUB_CALLBACK_URL=/auth/github/callback
GOOGLE_CALLBACK_URL=/auth/google/callback
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage
npm run test:coverage
```

---

## 📦 Deployment

- **Vercel**
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/your-username/your-repo)

---

## 📊 Roadmap

- [ ] Visualize and apply AI-generated diffs
- [ ] Real-time updates via WebSockets
- [ ] Implement a file tree view for browsing
- [ ] Add ability to save AI-generated changes

---

## 🤝 Contributing

Contributions are welcome!
Please read [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more information.

---

## 🙌 Acknowledgements

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Nanostores](https://nanostores.github.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Material-UI](https://mui.com/)

---

## 📬 Contact

Created by [@evillan0315](https://github.com/evillan0315) – feel free to reach out!
