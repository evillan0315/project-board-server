import { map } from 'nanostores';

// --- Store Interface ---
export interface TranslatorState {
  inputText: string;
  uploadedFileData: string | null;
  uploadedFileName: string | null;
  uploadedFileMimeType: string | null;
  targetLanguage: string; // e.g., 'English', 'Spanish'
  translatedContent: string | null;
  loading: boolean;
  error: string | null;
}

export const translatorStore = map<TranslatorState>({
  inputText: '',
  uploadedFileData: null,
  uploadedFileName: null,
  uploadedFileMimeType: null,
  targetLanguage: 'English', // Default target language
  translatedContent: null,
  loading: false,
  error: null,
});

export const setInputText = (text: string) => {
  translatorStore.setKey('inputText', text);
  // Clear file data if user starts typing
  if (text) {
    translatorStore.setKey('uploadedFileData', null);
    translatorStore.setKey('uploadedFileName', null);
    translatorStore.setKey('uploadedFileMimeType', null);
  }
};

export const setUploadedFile = (
  data: string | null,
  mimeType: string | null,
  fileName: string | null,
) => {
  translatorStore.setKey('uploadedFileData', data);
  translatorStore.setKey('uploadedFileMimeType', mimeType);
  translatorStore.setKey('uploadedFileName', fileName);
  // Clear text input if a file is uploaded
  if (data) {
    translatorStore.setKey('inputText', '');
  }
};

export const setTargetLanguage = (language: string) => {
  translatorStore.setKey('targetLanguage', language);
};

export const setTranslatedContent = (content: string | null) => {
  translatorStore.setKey('translatedContent', content);
};

export const setLoading = (isLoading: boolean) => {
  translatorStore.setKey('loading', isLoading);
};

export const setError = (message: string | null) => {
  translatorStore.setKey('error', message);
};

export const clearTranslatorState = () => {
  translatorStore.set({
    inputText: '',
    uploadedFileData: null,
    uploadedFileName: null,
    uploadedFileMimeType: null,
    targetLanguage: 'English',
    translatedContent: null,
    loading: false,
    error: null,
  });
};
