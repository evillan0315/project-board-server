# GoogleGeminiTtsService

A NestJS service for generating and storing speech audio using Google's Gemini 2.5 TTS (Text-to-Speech) model with support for single or multi-speaker synthesis.

## Table of Contents

* [Overview](#overview)
* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Usage](#usage)
* [API](#api)
* [Output](#output)
* [Dependencies](#dependencies)
* [Error Handling](#error-handling)
* [License](#license)

---

## Overview

`GoogleGeminiTtsService` leverages the Google Generative AI SDK to convert text prompts into synthesized speech audio. It supports:

* Single-speaker and multi-speaker TTS synthesis.
* Output in WAV format.
* File persistence to a designated directory.

---

## Installation

Install the required dependencies:

```bash
npm install @google/genai wav
```

Ensure the NestJS project has access to Node.js built-in modules like `fs` and `path`.

---

## Environment Variables

The following environment variable must be defined:

| Variable                | Description                       |
| ----------------------- | --------------------------------- |
| `GOOGLE_GEMINI_API_KEY` | Your Google Generative AI API key |

Add it to your `.env` file:

```env
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
```

---

## Usage

Inject `GoogleGeminiTtsService` into your NestJS module or service:

```ts
import { GoogleGeminiTtsService } from './google-gemini-tts.service';

constructor(private readonly ttsService: GoogleGeminiTtsService) {}

async generateAudio() {
  const prompt = 'Hello, this is a test message.';
  const speakers = [
    { speaker: 'user1', voiceName: 'en-US-Standard-A' },
  ];
  const audioPath = await this.ttsService.generateSpeech(prompt, speakers);
  console.log('Audio saved at:', audioPath);
}
```

---

## API

### `generateSpeech(prompt: string, speakers: SpeakerVoiceInput[], languageCode?: string): Promise<string>`

Generates speech audio from the provided prompt and speaker configuration.

#### Parameters

* `prompt` — The textual content to be synthesized.
* `speakers` — An array of speaker configurations:

  ```ts
  interface SpeakerVoiceInput {
    speaker: string;
    voiceName: string; // e.g., "en-US-Standard-B"
  }
  ```
* `languageCode` *(optional)* — BCP-47 code (default: `'en-US'`).

#### Returns

`Promise<string>` — Absolute path to the generated `.wav` file.

---

## Output

WAV files are saved in the following relative path:

```
<project-root>/src/../tts/voice/
```

Files are named in the format:

```
YYYY-MM-DD_<voiceNames>_<languageCode>.wav
```

---

## Dependencies

* [`@google/genai`](https://www.npmjs.com/package/@google/genai) – Google Generative AI SDK
* [`wav`](https://www.npmjs.com/package/wav) – For writing PCM buffers to WAV format
* Node.js core modules: `fs`, `path`

---

## Error Handling

Errors encountered during generation or file writing will throw an `HttpException` with the appropriate status:

* `500 INTERNAL_SERVER_ERROR` – Missing API key.
* `400 BAD_REQUEST` – No audio data received from the API.
* `502 BAD_GATEWAY` – General failure during TTS generation or file saving.

---

## License

This module is proprietary or covered under your project’s license. Modify this section as necessary.


