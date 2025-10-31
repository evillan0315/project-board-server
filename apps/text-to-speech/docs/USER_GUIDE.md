# User Guide

This guide provides instructions on how to effectively use the Google Gemini TTS & AI Code Planner frontend application.

## 1. Authentication

Before accessing most features, you need to log in.

1.  **Navigate to the Login Page:** Click the "Login" button in the top right corner of the navigation bar, or navigate directly to `/login`.
2.  **Login Options:**
    *   **Email & Password:** Enter your registered email and password. If you don't have an account, you can register (if the backend supports it, a "Register" link will be available).
    *   **Google / GitHub OAuth:** Click the "Sign in with Google" or "Sign in with GitHub" buttons. You will be redirected to the respective OAuth provider's login page, and then back to the application upon successful authentication.

Once logged in, your user name or email will appear in the navigation bar.

## 2. Google Gemini Text-to-Speech (TTS) Generator

This feature allows you to convert text into natural-sounding speech using Google Gemini's advanced TTS models.

### 2.1 Accessing the TTS Generator

1.  From the homepage (`/`), click on the "Text-to-Speech Generator" card, or navigate directly to the TTS Landing Page (`/tts`) and then click "Start Generating Speech", or directly to the generator page (`/tts-generator`).

### 2.2 Generating Speech

1.  **Text Prompt:**
    *   Enter the text you want to convert to speech in the large "Text Prompt" text area.
    *   **For multiple speakers:** Use the format `SpeakerName: Your text here.` for each segment of dialogue.
        *   Example: `Eddie: Hello, world! Marionette: How are you doing today?`

2.  **Language Code:**
    *   Select or type a [BCP-47 language code](https://datatracker.ietf.org/doc/html/bcp47) in the "Language Code" field (e.g., `en-US` for US English, `es-ES` for Spanish (Spain)). The default is `en-US`.

3.  **Speakers Configuration:**
    *   **Default Speakers:** By default, two speakers ("Eddie" and "Marionette" with default voices) are provided.
    *   **Add Speaker:** Click the "Add Speaker" button to add a new speaker row.
    *   **Configure Speaker:**
        *   **Speaker Name:** Enter a unique name for your speaker (e.g., `CharacterA`). This name is used in your "Text Prompt" to assign dialogue.
        *   **Voice Name:** Select or type a valid voice name. Valid voice names depend on the Google Gemini TTS API and your backend's configuration. Common examples include `kore`, `puck`, `fenrir`, `zephyr`. If an invalid voice name is used, the backend will return an error.
    *   **Remove Speaker:** Click the trash can icon next to a speaker row to remove it. (You must have at least one speaker.)
    *   Ensure that the speaker names used in your "Text Prompt" exactly match the `Speaker Name` configured in this section.

4.  **Generate Speech:**
    *   Once your prompt, language, and speakers are configured, click the "Generate Speech" button.
    *   A loading indicator will show while the audio is being generated.
    *   Any errors (e.g., authentication, invalid voice names, API issues) will be displayed in an alert.

5.  **Playback:**
    *   Upon successful generation, an audio player will appear below the generator, allowing you to listen to the synthesized speech.

## 3. AI Code Planner

This feature allows you to describe desired code changes in natural language, generate a structured plan of modifications, and apply them directly to your local project.

### 3.1 Accessing the AI Code Planner

1.  From the homepage (`/`), click on the "AI Code Planner" card, or navigate directly to the AI Planner Landing Page (`/planner`) and then click "Start Planning Code", or directly to the planner page (`/planner-generator`).

### 3.2 Generating a Code Plan

1.  **Enter your prompt for the AI:**
    *   In the main text area, clearly describe the code changes you want the AI to make. Be as specific as possible.
        *   Example: "Add a new Material UI `Card` component to `src/pages/HomePage.tsx` to showcase a 'New Feature' with an `Analytics` icon. This card should link to `/new-feature`."
        *   Example: "Refactor the `authService.ts` file to use `fetch` instead of `axios` for all API calls."

2.  **Configure Project Context (Optional but Recommended):**
    *   **Select Project Root Directory** (Folder Open Icon):
        *   Click the folder icon. A drawer will open, displaying the current project root path.
        *   Manually type or paste the absolute path to your frontend project's root directory (e.g., `/media/eddie/Data/projects/nestJS/nest-modules/project-board-server/apps/text-to-speech`). This is crucial for the AI to correctly locate files.
        *   Click "Go" to update the path.
        *   Click "Select" in the drawer's footer to confirm and close.
    *   **Manage AI Scan Paths** (Road/Fork Icon):
        *   Click the road/fork icon. A drawer will open to manage which directories/files the AI should scan for context.
        *   **Suggested Paths:** Select from the list of common project directories/files (e.g., `src`, `public`, `package.json`, `README.md`).
        *   **Enter External Path:** If `allowExternalPaths` is enabled, you can manually add paths not in the suggestions. Type a path and click the "Add Path" icon.
        *   **Remove Path:** Click the 'x' on any chip to remove a selected path.
        *   Click "Confirm" in the drawer's footer to save changes.
    *   **Edit AI Instructions (System Prompt)** (Description Icon):
        *   Click the description icon. A drawer will open allowing you to customize the AI's system instructions (the "prompt" that defines its role and rules). This is pre-filled with best practices but can be modified for specific behaviors.
        *   Edit the Markdown content, then click "Save".
    *   **Edit Expected Output Format (JSON Schema)** (Schema Icon):
        *   Click the schema icon. A drawer will open to define the exact JSON schema the AI should adhere to for its plan output.
        *   Edit the JSON schema, then click "Save".

3.  **Generate Plan:**
    *   Once your prompt and configurations are set, click the "Generate Plan" button.
    *   A loading indicator will appear while the AI processes your request and generates the plan.
    *   Any errors from the AI or backend will be displayed.

### 3.3 Reviewing and Applying a Plan

1.  **Plan Display:**
    *   If successful, the generated plan will appear in a detailed format below the generator. This includes:
        *   **Title & Summary:** High-level overview of the plan.
        *   **Thought Process:** The AI's reasoning behind the proposed changes.
        *   **Documentation:** Any extended notes or recommendations from the AI.
        *   **File Changes:** A table listing each proposed file operation (ADD, MODIFY, DELETE, REPAIR, ANALYZE), the file path, and a reason.
        *   **Git Instructions:** Suggested Git commands to stage and commit the changes.

2.  **Apply Plan:**
    *   After carefully reviewing the plan, click the "Apply Plan" button at the bottom of the plan display.
    *   A confirmation/status message will appear.
    *   If successful, the AI's proposed changes will be applied directly to the files in your `VITE_BASE_DIR` project.
    *   **Important:** Always review the plan thoroughly before applying, and consider committing your current work beforehand.

3.  **Clear Plan:**
    *   Click the "Clear Plan" button to reset the planner state and start a new plan.
