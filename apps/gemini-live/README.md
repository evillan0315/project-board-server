# 🚀 Gemini Live App

[![License](https://img.shields.io/github/license/your-username/your-repo)](LICENSE)
[![Issues](https://img.shields.io/github/issues/your-username/your-repo)](https://github.com/your-username/your-repo/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/your-username/your-repo)](https://github.com/your-username/your-repo/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/your-username/your-repo)](https://github.com/your-username/your-repo/commits)

> Real-time voice and video interactions with Google Gemini Live API, featuring OAuth2 authentication.

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

- ⚡ Real-time voice interaction with Gemini Live API
- 🎤 Microphone audio streaming to backend
- 🗣️ AI-generated audio playback
- 📹 Live video feed display (input for future video streaming)
- 🔒 Google OAuth2 Authentication
- 🔐 GitHub OAuth2 Authentication
- 🌍 Client-side routing with React Router DOM
- 🔄 Global state management with Nanostores
- 🎨 Styled with Tailwind CSS and Material-UI components
- 🛡️ Type-safe development with TypeScript

---

## 📂 Project Structure

```bash
gemini-live/
├── src/              # Source code
│   ├── api/          # API service definitions
│   ├── components/   # Reusable UI components
│   │   ├── ui/       # Generic UI elements
│   │   └── ...       # App-specific components (e.g., Navbar, LiveInteraction)
│   ├── hooks/        # Custom React Hooks (e.g., useAudioRecorder, useGeminiLiveSocket)
│   ├── pages/        # Main application pages (e.g., HomePage, LoginPage, GeminiLivePage)
│   ├── services/     # Services for backend interaction (e.g., authService)
│   ├── stores/       # Nanostores for global state (e.g., authStore, geminiLiveStore)
│   ├── types/        # TypeScript type definitions
│   ├── App.tsx       # Main application component and routing
│   ├── main.tsx      # Entry point for React app
│   └── index.css     # Global CSS styles
├── public/           # Static assets
├── .env.example      # Example environment variables
├── package.json      # Dependencies & scripts
├── tsconfig.json     # TypeScript configuration
├── vite.config.ts    # Vite build configuration
└── README.md         # Project documentation
```

---

## 📋 Requirements

- Node.js >= 18
- Backend services running (e.g., NestJS application from this monorepo)

---

## 🛠️ Installation

```bash
# Navigate to the project directory
cd apps/gemini-live

# Install dependencies
pnpm install   # or npm install / yarn install
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

This frontend interacts with the NestJS backend through HTTP REST endpoints for authentication and WebSockets for real-time Gemini Live interactions. Refer to the backend documentation for detailed API specifications.

---

## 🔑 Environment Variables

Create a `.env` file in the `apps/gemini-live` directory. You will need to obtain API keys and configure callback URLs for Google and GitHub OAuth applications. Replace placeholder values with your actual credentials.

```ini
VITE_API_URL=http://localhost:3000 # Your backend API URL
VITE_FRONTEND_URL=http://localhost:3000 # Your frontend URL for OAuth redirects

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# GitHub OAuth2 Credentials
GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
```

---

## 🧪 Testing

```bash
# (Add testing commands here if implemented)
```

---

## 📦 Deployment

This is a standard Vite React application and can be deployed to any static hosting service (e.g., Vercel, Netlify) or served via a web server. Ensure environment variables are correctly configured for your production environment.

---

## 📊 Roadmap

- [ ] Implement full real-time video streaming to Gemini Live API
- [ ] Enhance UI for conversation history and message display
- [ ] Add loading states and error handling for all interactions
- [ ] Implement text-to-speech for AI audio responses if not handled by Gemini's audio stream directly.

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
- [Tailwind CSS](https://tailwindcss.com/)
- [Material-UI](https://mui.com/)
- [Nanostores](https://nanostores.github.io/)
- [Socket.IO](https://socket.io/)
- [react-webcam](https://www.npmjs.com/package/react-webcam)
- [webrtc-adapter](https://www.npmjs.com/package/webrtc-adapter)
- [Google Gemini API](https://ai.google.dev/)

---

## 📬 Contact

Created by [@evillan0315](https://github.com/evillan0315) – feel free to reach out!
