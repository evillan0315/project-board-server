# Resume AI Assistant - Frontend

![Resume AI Assistant Banner](https://via.placeholder.com/1200x400/0F52BA/FFFFFF?text=Resume+AI+Assistant)

Welcome to the **Resume AI Assistant**, a powerful web application designed to help you create, optimize, and enhance your resume using artificial intelligence. Whether you're a job seeker looking to tailor your resume for specific roles or a developer interested in contributing to an AI-driven project, this tool provides a comprehensive solution.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Usage](#usage)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Author & Contact](#author--contact)

## Features

🚀 **Resume Parsing**: Upload your resume (PDF, DOCX) and have its content automatically extracted into plain text.

✨ **AI Optimization**: Analyze your resume against a specific job description to get an 'optimization score' and detailed, actionable suggestions for improvement.

✍️ **AI Generation**: Generate a brand new resume from scratch based on a simple text prompt describing your experience and desired role.

💡 **AI Enhancement**: Enhance specific sections or the entire resume with AI, making it more concise, impactful, and tailored to your goals.

🔒 **User Authentication**: Securely log in using OAuth with Google or GitHub.

## Technologies Used

This project is built using modern web technologies to provide a fast, responsive, and maintainable user interface.

**Frontend**:

- **React 19**: A declarative, component-based JavaScript library for building user interfaces.
- **TypeScript**: A strongly typed superset of JavaScript that enhances code quality and developer experience.
- **Vite**: A fast next-generation frontend tooling that provides an extremely quick development experience.
- **Tailwind CSS v4 (upcoming)**: A utility-first CSS framework for rapidly building custom designs.
- **Material-UI (MUI)**: A popular React UI framework for a consistent and accessible design system.
- **nanostores**: A tiny, efficient state management library for React and other frameworks.
- **react-router-dom**: For declarative routing within the single-page application.

**Backend**: (Separate project - usually a NestJS application)

- **NestJS**: A progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **OpenAI API / Gemini API**: For AI capabilities (natural language processing, text generation, summarization).
- **Prisma**: An open-source ORM (Object-Relational Mapper) for Node.js and TypeScript, used for database interactions.
- **Passport.js**: Authentication middleware for Node.js.
- **JWT (JSON Web Tokens)**: For secure API authentication.
- **PostgreSQL**: A powerful, open-source object-relational database system.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/)
- Git

### Frontend Setup

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/evillan0315/resume-app.git
    cd resume-app
    ```

2.  **Install dependencies**:

    ```bash
    yarn install
    # or
    npm install
    ```

3.  **Environment Variables**: Create a `.env` file in the root of the project with the following variables. These should match your backend configuration.

    ```dotenv
    # API Base URL for the backend
    VITE_API_URL=http://localhost:3000 # Adjust if your backend runs on a different port or host

    # Frontend URL (used for OAuth redirects from backend)
    VITE_FRONTEND_URL=http://localhost:3001 # Adjust if your frontend runs on a different port

    # Google OAuth credentials (get these from Google Cloud Console)
    VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    VITE_GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET # Not directly used by frontend, but good to have if needed
    VITE_GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback # Must match backend and Google Console

    # GitHub OAuth credentials (get these from GitHub OAuth Apps)
    VITE_GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
    VITE_GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET # Not directly used by frontend
    VITE_GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback # Must match backend and GitHub OAuth settings
    ```

4.  **Start the development server**:
    ```bash
    yarn dev
    # or
    npm run dev
    ```
    The frontend application will typically run on `http://localhost:3001`.

### Backend Setup

This frontend application requires a running backend service to provide AI capabilities and authentication. Please refer to the [backend repository](https://github.com/evillan0315/project-board-server) for setup instructions. Ensure your backend is configured to run on the `VITE_API_URL` specified in your `.env` file (e.g., `http://localhost:3000`).

## Usage

Once the frontend and backend servers are running, open your browser to `http://localhost:3001` (or your configured `VITE_FRONTEND_URL`).

- **Login**: Use the Google or GitHub OAuth options to sign in.
- **Resume Upload/Input**: Navigate to the 'Upload / Input Resume' tab to either upload a file or paste your resume content.
- **Job Description**: Provide the job description you want to tailor your resume for.
- **Optimize**: Click 'Optimize Resume' to get an optimization score and detailed suggestions.
- **Generate/Enhance**: Switch to the 'Generate / Enhance Resume' tab to create a new resume from a prompt or enhance existing content.

For a more detailed guide on how to use the application, please refer to the [User Guide](#documentation).

## Documentation

- [**User Guide**](./docs/user-guide.md): Step-by-step instructions for end-users on how to leverage all features of the application.
- [**Developer Guide**](./docs/developer-guide.md): In-depth information for developers, including project structure, development setup, and key concepts.

## Contributing

We welcome contributions to the Resume AI Assistant! Here are some ways you can contribute:

- **Report Bugs**: If you find any issues, please open an issue on the [GitHub repository](https://github.com/evillan0315/resume-app/issues).
- **Suggest Features**: Have an idea for a new feature? Open an issue to discuss it.
- **Submit Pull Requests**: Feel free to fork the repository, make your changes, and submit a pull request. Please ensure your code adheres to the project's coding standards and includes relevant tests.

## License

This project is licensed under the MIT License.

**MIT License**

Copyright (c) 2024 Eddie Villanueva

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Author & Contact

- **Author**: Eddie Villanueva
- **GitHub**: [https://github.com/evillan0315](https://github.com/evillan0315)
- **Email**: [evillan0315@gmail.com](mailto:evillan0315@gmail.com)
