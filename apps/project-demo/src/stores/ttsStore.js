import { atom } from 'nanostores';
import { nanoid } from 'nanoid';
import { geminiTtsService } from '../api/geminiTtsService';
export const ttsStore = atom({
    prompt: '',
    // Updated voice names to be supported by the backend based on the error message
    speakers: [
        { id: nanoid(), speaker: 'Eddie', voiceName: 'Kore' },
        { id: nanoid(), speaker: 'Marionette', voiceName: 'Puck' },
    ],
    languageCode: 'en-US',
    loading: false,
    error: null,
    audioUrl: null,
});
// Action to set prompt
ttsStore.setPrompt = (newPrompt) => {
    ttsStore.set({ ...ttsStore.get(), prompt: newPrompt });
};
// Action to set language code
ttsStore.setLanguageCode = (newLangCode) => {
    ttsStore.set({ ...ttsStore.get(), languageCode: newLangCode });
};
// Action to add a new speaker
ttsStore.addSpeaker = () => {
    const currentSpeakers = ttsStore.get().speakers;
    ttsStore.set({
        ...ttsStore.get(),
        speakers: [...currentSpeakers, { id: nanoid(), speaker: '', voiceName: '' }],
    });
};
// Action to update an existing speaker
ttsStore.updateSpeaker = (id, field, value) => {
    const currentSpeakers = ttsStore.get().speakers;
    const updatedSpeakers = currentSpeakers.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    ttsStore.set({ ...ttsStore.get(), speakers: updatedSpeakers });
};
// Action to remove a speaker
ttsStore.removeSpeaker = (id) => {
    const currentSpeakers = ttsStore.get().speakers;
    const filteredSpeakers = currentSpeakers.filter((s) => s.id !== id);
    ttsStore.set({ ...ttsStore.get(), speakers: filteredSpeakers });
};
// Action to set error
ttsStore.setError = (errorMessage) => {
    ttsStore.set({ ...ttsStore.get(), error: errorMessage });
};
// Action to generate speech
ttsStore.generateSpeech = async (request) => {
    ttsStore.set({
        ...ttsStore.get(),
        loading: true,
        error: null,
        audioUrl: null,
    });
    try {
        const audioBlob = await geminiTtsService.generateSpeech(request);
        const url = URL.createObjectURL(audioBlob);
        ttsStore.set({ ...ttsStore.get(), audioUrl: url, loading: false });
    }
    catch (err) {
        ttsStore.set({
            ...ttsStore.get(),
            error: err.message || 'Failed to generate speech.',
            loading: false,
        });
    }
};
