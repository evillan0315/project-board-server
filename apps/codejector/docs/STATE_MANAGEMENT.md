# State Management with Nanostores

This document outlines the state management strategy used in the `project-board-front` application, which leverages [Nanostores](https://nanostores.github.io/) for efficient, reactive, and minimalist global state management.

## Why Nanostores?

Nanostores were chosen for their simplicity, small bundle size, and performance benefits, aligning with React's functional component and hooks paradigm. Key advantages include:

-   **Minimal API**: Easy to learn and use with a straightforward `map` store for objects and `atom` for primitives.
-   **Reactive**: Components re-render only when the specific data they subscribe to changes.
-   **Lightweight**: Small footprint, contributing to faster load times.
-   **TypeScript-first**: Excellent TypeScript support for robust type-safe state.
-   **Framework Agnostic**: While used with React, Nanostores are plain JavaScript objects, making them flexible for future changes.

## Core Concepts

1.  **Stores**: A store is a JavaScript object that holds a piece of state. In this project, `map` stores are predominantly used for complex objects.
    ```typescript
    import { map } from 'nanostores';

    interface MyState { 
      count: number;
      message: string;
    }

    export const myStore = map<MyState>({
      count: 0,
      message: 'Hello'
    });
    ```

2.  **Actions**: Functions that modify the state of a store. Actions are typically defined alongside the store and encapsulate the logic for state transitions.
    ```typescript
    export const increment = () => {
      const currentCount = myStore.get().count;
      myStore.setKey('count', currentCount + 1);
    };

    export const setMessage = (newMessage: string) => {
      myStore.setKey('message', newMessage);
    };
    ```

3.  **Hooks (`useStore`)**: In React components, the `useStore` hook from `@nanostores/react` is used to subscribe to store changes and trigger component re-renders.
    ```typescript
    import React from 'react';
    import { useStore } from '@nanostores/react';
    import { myStore, increment, setMessage } from '@/stores/myStore';

    const MyComponent: React.FC = () => {
      const { count, message } = useStore(myStore);

      return (
        <div className='p-4'>
          <p>Count: {count}</p>
          <p>Message: {message}</p>
          <button onClick={increment}>Increment</button>
          <button onClick={() => setMessage('New message!')}>Set Message</button>
        </div>
      );
    };
    ```

## Global Stores in Project Board

All global stores are located in the `src/stores/` directory. Each store manages a specific domain of the application state.

-   **`authStore.ts`**: Manages user authentication status (`isLoggedIn`, `user`, `loading`, `error`). Actions include `loginSuccess`, `logout`, `setLoading`, `setError`.
-   **`aiEditorStore.ts`**: Handles state related to the AI Code Editor, including the user prompt (`instruction`), AI's system instructions (`aiInstruction`, `expectedOutputInstruction`), various AI request parameters (`requestType`, `llmOutputFormat`, `uploadedFile`), AI responses (`lastLlmResponse`, `selectedChanges`, `currentDiff`), file application process (`applyingChanges`, `appliedMessages`, `gitInstructions`), and the opened file viewer (`openedFile`, `openedFileContent`, `isOpenedFileDirty`).
-   **`fileTreeStore.ts`**: Manages the project's file tree data (`files`, `flatFileList`), UI state (`expandedDirs`, `selectedFile`), and loading states for tree operations (`isFetchingTree`, `fetchTreeError`, `loadingChildren`). Actions include `loadInitialTree`, `toggleDirExpansion`, `setSelectedFile`, `loadChildrenForDirectory`.
-   **`themeStore.ts`**: Controls the application's UI theme (`mode: 'light' | 'dark'`). Action: `toggleTheme`, `setTheme`.
-   **`spotifyStore.ts`**: Manages the state of the integrated Spotify-like music player (e.g., `currentTrack`, `isPlaying`, `progress`, `volume`).
-   **`translatorStore.ts`**: Manages state for the AI Translator app (e.g., `inputText`, `uploadedFileData`, `targetLanguage`, `translatedContent`).
-   **`geminiLiveStore.ts`**: Manages state for the Gemini Live Audio feature (e.g., `sessionId`, `isRecording`, `aiResponseText`, `aiResponseAudioQueue`).
-   **`contextMenuStore.ts`**: Manages the visibility, position, and items of dynamic context menus (e.g., for the file tree).
-   **`organizationStore.ts`**: Manages a list of `Organization` objects and the `currentOrganization` for project management.
-   **`projectStore.ts`**: Manages a list of `Project` objects and the `currentProject` for a selected organization.
-   **`recordingStore.ts`**: Manages state for the screen recording functionality.
    -   `currentRecordingIdStore`: Stores the ID of the currently active recording, enabling components to track the recording state across the application.

## Best Practices with Nanostores

-   **Encapsulation**: Keep state and its modifying actions (`setKey`, `set`) within the same store file.
-   **Selectors**: For derived state or complex computations, consider creating helper functions that read from the store without directly modifying it, or use Nanostores' `computed` for reactive derived state.
-   **Asynchronous Logic**: API calls and other side effects are typically handled in `services/` and then dispatch actions to update the relevant stores (e.g., `authService` calls `authStore.loginSuccess`).
-   **Minimize Re-renders**: `useStore` is smart about only re-rendering components when the specific part of the state they access changes. Accessing individual keys with `store.get().key` in effects or callbacks is often more efficient than destructuring the whole store object.

By centralizing state management with Nanostores, the application maintains a clear, predictable, and performant data flow, making it easier to understand, debug, and scale.