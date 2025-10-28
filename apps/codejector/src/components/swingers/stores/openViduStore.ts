import { map } from 'nanostores';
import { IOpenViduPublisher, IOpenViduSubscriber, ISession } from '@/components/swingers/types';
import { OpenVidu } from 'openvidu-browser'; // Import OpenVidu class
import { getSession } from '@/components/swingers/api/sessions';

interface OpenViduStoreState {
  currentSessionId: string | null;
  session: ISession | null; // OpenVidu Session object
  publisher: IOpenViduPublisher | null; // Local publisher
  subscribers: IOpenViduSubscriber[]; // Remote subscribers
  loading: boolean;
  error: string | null;
  openViduInstance: OpenVidu | null; // The OpenVidu object itself
  isCameraActive: boolean; // Camera state
  isMicActive: boolean; // Microphone state
  sessionNameInput: string; // Input field for session name
}

export const openViduStore = map<OpenViduStoreState>({
  currentSessionId: null,
  session: null,
  publisher: null,
  subscribers: [],
  loading: false,
  error: null,
  openViduInstance: null, // Initialize OpenVidu instance as null
  isCameraActive: false, // Default to camera inactive
  isMicActive: true, // Default to microphone active
  sessionNameInput: '', // Default empty
});

export const resetOpenViduStore = () => {
  // Preserve the existing OpenVidu instance instead of setting to null
  // This prevents unnecessary re-initialization of the OpenVidu object itself
  // when only the session/publisher state needs to be reset.
  const currentOpenViduInstance = openViduStore.get().openViduInstance;
  openViduStore.set({
    currentSessionId: null,
    session: null,
    publisher: null,
    subscribers: [],
    loading: false,
    error: null,
    openViduInstance: currentOpenViduInstance, // Re-use the existing instance
    isCameraActive: false, // Reset to default inactive
    isMicActive: true, // Reset to default active
    sessionNameInput: '', // Reset to default
  });
};

export const setOpenViduSessionId = (sessionId: string | null) => {
  openViduStore.setKey('currentSessionId', sessionId);
};

export const setOpenViduSession = (session: ISession | null) => {
  openViduStore.setKey('session', session);
};

export const setOpenViduPublisher = (publisher: IOpenViduPublisher | null) => {
  openViduStore.setKey('publisher', publisher);
};

export const addOpenViduSubscriber = (subscriber: IOpenViduSubscriber) => {
  openViduStore.setKey('subscribers', [...openViduStore.get().subscribers, subscriber]);
};

export const removeOpenViduSubscriber = (streamId: string) => {
  openViduStore.setKey(
    'subscribers',
    openViduStore.get().subscribers.filter((s) => s.streamId !== streamId),
  );
};

export const setOpenViduLoading = (loading: boolean) => {
  openViduStore.setKey('loading', loading);
};

export const setOpenViduError = (error: string | null) => {
  openViduStore.setKey('error', error);
};

export const setOpenViduInstance = (instance: OpenVidu | null) => {
  openViduStore.setKey('openViduInstance', instance);
};

export const setIsCameraActive = (active: boolean) => {
  openViduStore.setKey('isCameraActive', active);
};

export const setIsMicActive = (active: boolean) => {
  openViduStore.setKey('isMicActive', active);
};

export const setSessionNameInput = (name: string) => {
  openViduStore.setKey('sessionNameInput', name);
};
