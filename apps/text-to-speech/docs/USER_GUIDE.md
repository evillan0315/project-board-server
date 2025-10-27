# Google Gemini Text-to-Speech Generator: User Guide

Welcome to the Google Gemini Text-to-Speech Generator! This application allows you to convert written text into natural-sounding speech using advanced AI models. You can customize the speech with multiple speakers, select different voices, and play the generated audio directly in your browser.

## Key Features

*   **Secure Authentication**: Log in using your email/password, Google, or GitHub accounts.
*   **Simple Text Input**: Easily type or paste the text you want to convert to speech.
*   **Multi-Speaker Support**: Define multiple speakers within your text and assign unique AI voices to each for dynamic conversations.
*   **Language Selection**: Choose the language for your speech output (e.g., English, Spanish).
*   **Instant Audio Playback**: Listen to your generated audio immediately after synthesis.
*   **Clear Feedback**: See loading indicators and error messages to understand the application's status.

## Getting Started

To use the TTS Generator, you first need to log in.

1.  **Access the Application**: Navigate to the application's URL (e.g., `http://localhost:3002` if running locally, or your deployed URL).
2.  **Login**: You will be redirected to the login page. You can choose to:
    *   **Login with Email and Password**: If you have an existing account on the backend system.
    *   **Login with Google**: Use your Google account for a quick login.
    *   **Login with GitHub**: Use your GitHub account for authentication.
3.  **Authentication Callback**: After logging in with Google or GitHub, you will be redirected back to the application. If successful, you'll be taken to the TTS generation page.

## Using the Text-to-Speech Generator

Once logged in, you can start generating speech:

### 1. Input Your Text

In the main text area, type or paste the content you want to convert.
For multi-speaker output, format your text by prefixing each speaker's lines with their name followed by a colon, like this:

```
Eddie: Hello, how are you today?
Marionette: I am doing great, Eddie!
```

### 2. Configure Speakers

Below the text input, you will find the "Speaker Configuration" section.

*   **Add Speaker**: Click the "Add Speaker" button to add a new speaker profile.
*   **Speaker Name**: Enter a name for the speaker (e.g., "Eddie", "Marionette"). This name should match the prefixes you use in your text input.
*   **Voice Name**: Select an AI voice for this speaker. Examples include `en-US-Studio-F` or `en-US-Studio-B`. The available voices depend on the backend configuration and Google Gemini's offerings.
*   **Remove Speaker**: Click the trashcan icon next to a speaker to remove their profile.

**Important**: Ensure that every speaker name you use in your text input has a corresponding entry in the "Speaker Configuration" with an assigned voice.

### 3. Select Language

Choose the desired language code for the speech output from the dropdown menu (e.g., `en-US` for US English).

### 4. Generate Speech

Once your text is entered, speakers are configured, and language is selected, click the "Generate Speech" button.

*   The application will display a loading indicator while processing your request.
*   Upon successful generation, an audio player will appear, and the generated `.wav` file will automatically start playing.

### 5. Playback and Control

Use the audio player to:

*   Play/Pause the audio.
*   Adjust the volume.
*   Seek through the audio.
*   Download the `.wav` file (usually available via the audio player's context menu or controls).

## Troubleshooting

*   **"Authentication Failed" / Cannot Log In**:
    *   Ensure your internet connection is stable.
    *   If using Google/GitHub, check if your accounts are properly linked or authorized.
    *   If self-hosting, ensure the backend server is running and configured correctly.
*   **"No Audio / Error Generating Speech"**:
    *   Check your text input for any unusual characters or formatting.
    *   Verify that all speaker names in your text have corresponding configurations with valid `Voice Name`s.
    *   Ensure the selected `Language Code` is correct.
    *   Check the browser's developer console for any error messages (for advanced users).
    *   If self-hosting, ensure the backend server is running and accessible.
*   **Playback Issues**:
    *   Check your device's volume.
    *   Try refreshing the page.

If you encounter persistent issues, please contact your system administrator or refer to the developer documentation for more technical details.

## Frequently Asked Questions (FAQ)

*   **Can I use any voice name?** No, voice names must be valid voices supported by Google Gemini's Text-to-Speech service and configured in the backend.
*   **What if I don't configure a speaker name used in the text?** The generation might fail or produce unexpected results. Always configure all speakers used in your text.
*   **Is there a limit to the text length?** There might be limits imposed by the backend or the underlying Google Gemini API. Long texts might take longer to process.
*   **Can I download the generated audio?** Yes, most modern browser audio players allow you to download the audio file directly.

Thank you for using the Google Gemini Text-to-Speech Generator!
