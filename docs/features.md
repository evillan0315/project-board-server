# Project Features Overview

This monorepo project offers a suite of integrated applications and services designed to enhance productivity for developers and provide various utility tools. Below is an overview of the key features across different components.

## 1. AI Editor (AI-driven CLI)

Located in `ai-editor/`, this is a powerful command-line interface designed to assist with code generation and manipulation using AI.

- **AI-Powered Code Generation**: Generate new code snippets, files, or entire modules based on natural language prompts.
- **Intelligent Refactoring**: Analyze existing code and suggest improvements, reformatting, or restructuring.
- **Automated Linting & Fixing**: Identify and fix code style issues and potential bugs automatically.
- **File Operations**: Perform complex file system operations, including reading, writing, renaming, and diffing.
- **Context Awareness**: Understand the current project context to provide more relevant AI responses.
- **Integration with Backend LLM**: Leverages the central NestJS backend for AI model interactions (e.g., Google Gemini).

## 2. Code Editor (Web Application)

Located in `code-editor/`, this is a comprehensive web-based code editor providing a rich development environment in the browser.

- **Real-time Code Editing**: Syntax highlighting, auto-completion, and error checking for various programming languages (powered by CodeMirror).
- **Integrated File Explorer**: Navigate project files and folders, create, delete, and rename files directly within the editor.
- **AI Chat Assistant**: An interactive chat panel integrated into the editor for AI-powered assistance (code suggestions, explanations, debugging help).
- **Integrated Terminal**: Execute shell commands directly within the web editor, mimicking a local terminal experience.
- **Audio Command Input**: Use voice commands to interact with the editor and AI assistant, allowing for hands-free operations.
- **Customizable Layout**: Resizable panels and flexible UI to adapt to different workflows.
- **Project Management**: Create and manage different code projects within the editor.

## 3. Frontend (Dashboard / Utility Hub)

Located in `frontend/`, this application serves as a central dashboard for various AI-powered tools and utilities.

- **Code Generation Interface**: A user-friendly UI to generate code snippets or files using natural language prompts.
- **Documentation Generation**: Automatically generate documentation for code based on AI analysis.
- **Resume Optimizer**: Upload resumes and receive AI-driven suggestions for optimization and enhancement.
- **Media Downloader**: Download audio and video content from various online sources.
- **Text-to-Speech (TTS)**: Convert text input into natural-sounding speech using AI models.
- **Swagger UI Integration**: View and interact with the backend API documentation directly from the dashboard.
- **Terminal Shell**: A web-based terminal interface to interact with backend commands.
- **Dynamic Forms**: Generate UI forms based on schema definitions for various backend operations.
- **Theme Management**: Switch between light and dark themes for a personalized experience.

## 4. Point of Sale (POS Application)

Located in `apps/point-of-sale/`, this is a standalone web application demonstrating a basic point-of-sale system.

- **Product Listing**: Display a list of available products.
- **Shopping Cart Functionality**: Add and remove items from a shopping cart.
- **Checkout Process**: Basic checkout flow.
- **Theme Context**: Demonstrates theme management within a smaller application.

## 5. Backend Services (NestJS)

Located in `src/` (root backend) and `ai-editor/src/` (AI Editor specific backend), this NestJS application provides the core API and business logic for all frontend applications.

- **Authentication & Authorization**: JWT-based authentication with OAuth support (Google, GitHub).
- **File Management**: APIs for creating, reading, updating, deleting, and searching files and folders across the project.
- **LLM Integration**: Seamless integration with large language models (e.g., Google Gemini) for text generation, code analysis, and more.
- **Terminal & Shell Execution**: Securely execute shell commands on the server, providing terminal-like functionality to web clients.
- **AWS Service Interaction**: APIs for interacting with AWS services (EC2, S3, RDS, Security Groups, Billing, DynamoDB).
- **Code Extraction & Linting**: Services for extracting code from various formats and linting source code (ESLint integration).
- **Audio/Video Processing**: Services for media transcoding and processing (FFmpeg integration).
- **Resume Parsing**: Backend services to parse and analyze resume documents.
- **Real-time Communication**: WebSocket gateways for real-time updates (e.g., terminal output, file changes, LLM streaming).
- **Logging**: Centralized logging of application events and errors.
- **Dynamic Schema Management**: Manage and submit dynamic schemas for form generation.
- **Microservice Architecture**: Organized into logical modules (Auth, File, LLM, Terminal, AWS, etc.) for scalability and maintainability.
