# Google Module Overview

The Google module provides integrations with various Google services, primarily focusing on AI capabilities through Google Gemini and user authentication via Google OAuth.

## Features

The Google module includes the following key integrations:

- **Google Gemini AI**:
  - **Text Generation**: Generate code, documentation, and other text content using Gemini Pro.
  - **Code Analysis & Repair**: Analyze and repair code snippets.
  - **Image Captioning**: Generate descriptive captions for images using Gemini Pro Vision.
  - **File-based Interactions**: Enhance resumes, generate files, and perform text/image generation based on file inputs.
  - **Text-to-Speech (TTS)**: Convert text into natural-sounding speech.
  - **Chat/Conversation**: Real-time interaction with Gemini models for conversational AI.

- **Google OAuth**:
  - Secure user authentication using Google's OAuth 2.0 protocol.
  - Integrates with the application's overall authentication system.

## Structure

The `src/google` directory is structured as follows:

- `gemini`: Contains the core logic for interacting with Google Gemini API, including:
  - `google-gemini.controller.ts` and `google-gemini.service.ts`: General text and code generation/analysis.
  - `google-gemini-file`: Specialized services for file-based AI interactions (e.g., resume optimization, image generation from files).
  - `google-gemini-image`: Handles image-related AI tasks like captioning.
  - `google-gemini-tts`: Provides Text-to-Speech capabilities.
  - `gemini.gateway.ts`: WebSocket gateway for real-time Gemini interactions (e.g., streaming responses).
- `google-oauth`: Manages the OAuth flow for Google authentication.

The `google.module.ts` orchestrates the integration of these services within the NestJS application.
