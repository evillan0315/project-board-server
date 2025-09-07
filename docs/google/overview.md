```markdown
# Google Module Overview

The Google module provides integrations with various Google services, primarily focusing on AI capabilities through Google Gemini and user authentication via Google OAuth.

## Features

The Google module includes the following key integrations:

- **Google Gemini AI**:
  - **Text Generation**: Generate code, documentation, and other text content using Gemini Pro/Flash.
  - **Code Analysis & Repair**: Analyze code snippets for issues, suggest improvements, and repair syntax or logical errors.
  - **Image Captioning**: Generate descriptive captions for images using Gemini Pro Vision.
  - **File-based Interactions**: Process and generate content based on various file inputs (e.g., analyze SQL schemas, generate/optimize/enhance resumes).
  - **Video Generation**: Create short video clips from text prompts using advanced Veo models (long-running operations).
  - **Text-to-Speech (TTS)**: Convert text into natural-sounding speech.
  - **Live Conversational AI**: Engage in real-time, streaming text and audio conversations with Gemini models.
  - **Chat/Conversation Management**: Track and retrieve the history of AI interactions, enabling context-aware follow-ups.

- **Google OAuth**:
  - Secure user authentication using Google's OAuth 2.0 protocol.
  - Integrates with the application's overall authentication system.

## Structure

The `src/google` directory is structured as follows:

- `google-gemini`: Contains the core logic for interacting with Google Gemini API, including:
  - `google-gemini.controller.ts` and `google-gemini.service.ts`: General text and code generation/analysis.
  - `google-gemini-file`: Specialized services for file-based AI interactions (e.g., resume optimization, image generation from files, **video generation**).
  - `google-gemini-image`: Handles image-related AI tasks like captioning.
  - `google-gemini-tts`: Provides Text-to-Speech capabilities.
- `google-gemini-live`: Contains the logic for real-time, streaming conversational AI interactions.
  - `google-gemini-live.gateway.ts`: WebSocket gateway for live AI interactions.
  - `google-gemini-live.service.ts`: Business logic for managing live Gemini sessions.
- `google-oauth`: Manages the OAuth flow for Google authentication.

The `google.module.ts` orchestrates the integration of these services within the NestJS application.
```
