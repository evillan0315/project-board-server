/**
 * audioUtils.ts
 * Provides utility functions for audio recording and playback in the browser.
 */

interface AudioRecordingOptions {
  mimeType?: string;
  sampleRate?: number; // Optional, useful for specific formats like WAV
}

interface AudioStreamCallbacks {
  onData: (audioChunk: string, mimeType: string) => void;
  onStop?: (finalAudioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioMimeType: string = 'audio/webm;codecs=opus'; // Default for most browsers

/**
 * Starts recording audio from the microphone and streams base64 chunks.
 * @param callbacks Callbacks for data, stop, and error events.
 * @param options Audio recording options like mimeType.
 * @returns A promise that resolves when recording starts, or rejects on error.
 */
export async function startAudioRecording(
  callbacks: AudioStreamCallbacks,
  options?: AudioRecordingOptions,
): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Determine the supported MIME type for recording
    const availableMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mpeg',
      'audio/wav',
    ];
    const preferredMimeType = options?.mimeType || 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported(preferredMimeType)) {
      audioMimeType = preferredMimeType;
    } else {
      const supported = availableMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      if (supported) {
        audioMimeType = supported;
        console.warn(`Preferred MIME type ${preferredMimeType} not supported. Using ${supported}.`);
      } else {
        throw new Error('No supported audio MIME type found for MediaRecorder.');
      }
    }

    mediaRecorder = new MediaRecorder(stream, { mimeType: audioMimeType });
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extract base64 part, remove 'data:audio/webm;base64,' prefix
          const base64data = (reader.result as string).split(',')[1];
          callbacks.onData(base64data, audioMimeType);
        };
        reader.onerror = (e) =>
          callbacks.onError?.(new Error(`FileReader error: ${e.target?.error?.message}`));
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: audioMimeType });
      callbacks.onStop?.(audioBlob);
      audioChunks = []; // Clear chunks after stopping
      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      callbacks.onError?.(event.error);
      // Stop all tracks to release microphone on error
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start(500); // Collect data every 500ms for real-time streaming
    console.log('Audio recording started.');
  } catch (err) {
    console.error('Error starting audio recording:', err);
    callbacks.onError?.(err as Error);
  }
}

/**
 * Stops the current audio recording.
 */
export function stopAudioRecording(): void {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    console.log('Audio recording stopped.');
  }
}

/**
 * Plays a base64 encoded audio string.
 * @param audioBase64 The base64 encoded audio data.
 * @param mimeType The MIME type of the audio (e.g., 'audio/wav', 'audio/mpeg').
 * @returns A promise that resolves when audio playback finishes, or rejects on error.
 */
export function playAudio(audioBase64: string, mimeType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioBlob = b64toBlob(audioBase64, mimeType);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error(`Audio playback error: ${e}`));
      };
      audio.play().catch(reject);
    } catch (error) {
      reject(new Error(`Failed to play audio: ${error}`));
    }
  });
}

/**
 * Converts a base64 string to a Blob.
 * @param b64Data Base64 string.
 * @param contentType MIME type of the data.
 * @param sliceSize Optional size for chunking.
 * @returns A Blob object.
 */
function b64toBlob(b64Data: string, contentType: string = '', sliceSize: number = 512): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}
