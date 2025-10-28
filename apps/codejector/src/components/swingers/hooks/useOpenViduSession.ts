import React, { useEffect, useCallback, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { useStore } from '@nanostores/react';
import { decrypt, encrypt } from '../utils/crypto';
import { createSession, getSession } from '@/components/swingers/api/sessions';
import { createConnection } from '@/components/swingers/api/connections';
import { ISession, IChatMessage, IClientConnectionUserData, IClientDataPayload } from '@/components/swingers/types';
import {
  openViduStore,
  setOpenViduSessionId,
  setOpenViduSession,
  setOpenViduPublisher,
  addOpenViduSubscriber,
  removeOpenViduSubscriber,
  setOpenViduLoading,
  setOpenViduError,
  resetOpenViduStore,
  setOpenViduInstance,
  setIsCameraActive,
  setIsMicActive,
  setSessionNameInput as setOpenViduSessionNameInput,
} from '@/components/swingers/stores/openViduStore';
import { fetchSessionConnections, clearConnections, currentDefaultConnection, fetchDefaultConnection } from '@/components/swingers/stores/connectionStore';
import { authStore } from '@/stores/authStore';
import { addChatMessage, clearChat } from '@/components/swingers/stores/chatStore';
import { nanoid } from 'nanoid';


/**
 * A custom hook to manage OpenVidu sessions within a React component.
 * Handles session connection, disconnection, publishing, subscribing, and media controls.
 * Includes functionality for sending and receiving chat messages via OpenVidu signals.
 * @param initialSessionId Optional: If provided, the session name input will be pre-filled and the session will attempt to auto-join.
 * @param connectionRole Optional: Specifies if the client should connect as a 'PUBLISHER' or 'SUBSCRIBER'. Defaults to 'PUBLISHER'.
 */
export const useOpenViduSession = (initialSessionId?: string, connectionRole: 'PUBLISHER' | 'SUBSCRIBER' = 'PUBLISHER') => {
  const ovState = useStore(openViduStore);
  const $auth = useStore(authStore);
  const $currentDefaultConnection = useStore(currentDefaultConnection);

  // Add a ref to track if media initialization is in progress to prevent race conditions
  const isMediaInitInProgress = useRef(false);

  // Ensure currentUserDisplayName is safely parsed or defaulted
  const currentUserDisplayName = React.useMemo(() => {
    
    try {
      if ($currentDefaultConnection.clientData) {
        console.log($currentDefaultConnection, '$currentDefaultConnection')
        const parsedPayload: IClientDataPayload = JSON.parse($currentDefaultConnection.clientData);
        return parsedPayload.clientData;
      } else {
        fetchDefaultConnection();
        const parsedPayload: IClientDataPayload = JSON.parse($currentDefaultConnection.clientData);
        return parsedPayload.clientData; 
      }
      
    } catch (e) {
      fetchDefaultConnection();
      const parsedPayload: IClientDataPayload = JSON.parse($currentDefaultConnection.clientData);
      return parsedPayload.clientData; 
    }
  }, [$currentDefaultConnection.clientData]);


  // `leaveSession` is triggered by user action or explicit logic, so it's safe to reset the store.
  const leaveSession = useCallback(async () => {
    const currentSession = openViduStore.get().session;
    const currentPublisher = openViduStore.get().publisher;
    const currentSessionId = openViduStore.get().currentSessionId;

    if (currentSession) {
      console.log(`Disconnecting from OpenVidu session ${currentSession.sessionId}...`);
      currentSession.disconnect();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (connectionRole === 'PUBLISHER' && currentPublisher && typeof currentPublisher.destroy === 'function') {
        currentPublisher.destroy();
        setOpenViduPublisher(null);
    } else if (connectionRole === 'SUBSCRIBER') {
        setOpenViduPublisher(null);
    }

    if (currentSessionId) {
      await fetchSessionConnections(currentSessionId);
    }
    resetOpenViduStore();
    clearConnections();
    clearChat();
    isMediaInitInProgress.current = false;
  }, [clearConnections, fetchSessionConnections, resetOpenViduStore, connectionRole, clearChat]);

  const initLocalMediaPreview = useCallback(async () => {
    if (connectionRole === 'SUBSCRIBER') {
      setOpenViduPublisher(null);
      return;
    }

    if (isMediaInitInProgress.current) {
        console.warn('Media initialization already in progress, skipping.');
        return;
    }
    const ovInstance = openViduStore.get().openViduInstance;

    if (!ovInstance) {
      setOpenViduError('OpenVidu instance not initialized.');
      return;
    }

    setOpenViduLoading(true);
    setOpenViduError(null);
    isMediaInitInProgress.current = true;
    try {
      const currentPublisher = openViduStore.get().publisher;
      if (currentPublisher && typeof currentPublisher.destroy === 'function') {
        console.log('Destroying existing publisher for re-initialization.');
        currentPublisher.destroy();
        setOpenViduPublisher(null);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const publisher = await ovInstance.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: undefined,
        publishAudio: openViduStore.get().isMicActive,
        publishVideo: openViduStore.get().isCameraActive,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });
      setOpenViduPublisher(publisher);
    } catch (error: any) {
      console.error('Error initializing local publisher for preview:', error);
      setOpenViduError(`Failed to start media preview: ${error.message || error}. This might be due to the device being in use by another application or tab.`);
      setOpenViduPublisher(null);
    } finally {
      setOpenViduLoading(false);
      isMediaInitInProgress.current = false;
    }
  }, [connectionRole]);

  const destroyLocalMediaPreview = useCallback(() => {
    const currentPublisher = openViduStore.get().publisher;
    if (currentPublisher && typeof currentPublisher.destroy === 'function') {
      console.log('Destroying local media preview publisher...');
      currentPublisher.destroy();
      setOpenViduPublisher(null);
    }
    isMediaInitInProgress.current = false;
  }, []);

  useEffect(() => {
    if (!ovState.openViduInstance) {
      setOpenViduInstance(new OpenVidu());
    }

    if (initialSessionId && !openViduStore.get().sessionNameInput) {
      setOpenViduSessionNameInput(initialSessionId);
    }

    return () => {
      const currentOvStateOnCleanup = openViduStore.get();

      if (currentOvStateOnCleanup.session) {
          leaveSession();
      } else if (connectionRole === 'PUBLISHER' && currentOvStateOnCleanup.publisher) {
          destroyLocalMediaPreview();
      }

      isMediaInitInProgress.current = false;
    };
  }, [initialSessionId, ovState.openViduInstance, leaveSession, destroyLocalMediaPreview, connectionRole]);

  useEffect(() => {
    if (connectionRole === 'PUBLISHER' && ovState.openViduInstance && !ovState.session && !isMediaInitInProgress.current) {
        //initLocalMediaPreview(); // Commented out to prevent aggressive re-init on dependency changes
    } else if (connectionRole === 'SUBSCRIBER' && ovState.publisher) {
        //destroyLocalMediaPreview();
    }
    return () => {
        const currentOvStateOnMediaCleanup = openViduStore.get();
        if (connectionRole === 'PUBLISHER' && currentOvStateOnMediaCleanup.publisher && !currentOvStateOnMediaCleanup.session) {
             destroyLocalMediaPreview();
        }
    };
  }, [connectionRole, ovState.openViduInstance, ovState.session, ovState.isCameraActive, ovState.isMicActive, initLocalMediaPreview, destroyLocalMediaPreview]);


  const handleSessionNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenViduSessionNameInput(event.target.value);
  }, []);

  const getToken = useCallback(async (mySessionId: string): Promise<string> => {
    try {
      const session = await getSession(mySessionId );

      const connection = await createConnection(session.sessionId, {
        role: connectionRole,
      });
      return connection.token;
    } catch (error) {
      if((error as any).statusCode===409){
      
      } else if((error as any).statusCode===404){
        const session = await createSession({ customSessionId: mySessionId });

        const connection = await createConnection(session.sessionId, {
          role: connectionRole,
        });
        return connection.token;
      }
      throw error; // Re-throw other errors
    }
  }, [connectionRole]);

  const joinSession = useCallback(async (sessionIdToJoin?: string) => {
    setOpenViduError(null);
    
    const ovSession = openViduStore.get().session;
    let ovPublisher = openViduStore.get().publisher;
    const ovInstance = openViduStore.get().openViduInstance;
    const ovSessionNameInput = openViduStore.get().sessionNameInput;
    
    const effectiveSessionId = sessionIdToJoin || ovSessionNameInput;

    if (ovSession && ovSession.sessionId !== effectiveSessionId) {
      console.warn(`Attempting to join session '${effectiveSessionId}' while active in '${ovSession.sessionId}'. Cleaning up old session first.`);
      await leaveSession();
      ovPublisher = openViduStore.get().publisher;
    }

    clearChat();

    try {
      console.log(effectiveSessionId, 'effectiveSessionId joinSession' );
      const token = await getToken(effectiveSessionId);
      const session = ovInstance.initSession();
      setOpenViduSessionId(effectiveSessionId);
      setOpenViduSession(session as ISession);
      
      //await ovInstance.enableProdMode();
      
      const devices = await ovInstance.getDevices()
     

      session.on('exception', (exception) => {
        console.error('OpenVidu Session Exception:', exception);
        const errorMessage = `OpenVidu Error: ${exception.name || 'Unknown'}. ${exception.message || ''}`; 
        setOpenViduError(errorMessage);
      });

      session.on('connectionPropertyChanged', (event) => {
        if (event.changedProperty === 'iceConnectionState') {
          console.log(`ICE Connection State changed for connection ${event.connection.connectionId}: ${event.newValue}`);
          if (event.newValue === 'failed') {
            setOpenViduError(`ICE Connection FAILED for connection ${event.connection.connectionId}. This often indicates network issues or problems with STUN/TURN servers.`);
          }
        }
      });
      
      session.on('connectionCreated', async (event) => {
         console.log('connectionCreated:', event);
         const latestPublisher = openViduStore.get().publisher;
         if (latestPublisher?.stream?.connection && event.connection.connectionId === latestPublisher.stream.connection.connectionId) {
             console.log('Skipping connectionCreated for own publisher.');
             return;
         }
      });

      session.on('streamCreated', async (event) => {
        
        console.log('streamCreated', event);
        let subscriber = session.subscribe(event.stream, undefined);
        subscriber.properties.subscribeToVideo = true;
        console.log('streamCreated subscriber', subscriber);
        setOpenViduError(null);
        subscriber.on('streamPlaying', (e) => {
          console.log(e, 'streamPlaying')
        });
        addOpenViduSubscriber(subscriber);
        //subscriber.addVideoElement(createGlides(clientData, subscriber));
        //await fetchSessionConnections(effectiveSessionId);
      });

      session.on('streamDestroyed', async (event) => {
        console.log('streamDestroyed', event);
        removeOpenViduSubscriber(event.stream.streamId);
        //await fetchSessionConnections(effectiveSessionId);
      });

      session.on('networkQualityChanged', (event) => {
        console.log('Network quality changed:', event);
      });
      
      session.on(`signal:global`, (event) => {
        console.log(`Chat message from room ${effectiveSessionId} global`, event);
        const localPublisherConnectionId = openViduStore.get().publisher?.stream?.connection?.connectionId;
        const signalSenderConnectionId = event.from?.connectionId;

        // Deduplicate: If the signal sender is our own publisher, skip to prevent double adding.
        if (localPublisherConnectionId && signalSenderConnectionId && localPublisherConnectionId === signalSenderConnectionId) {
            console.log('Received own chat message via global signal, skipping to prevent duplication.');
            return;
        }

        try {
          const signalData = JSON.parse(event.data || '{}');
          const connectionData = event.from?.data;

          let senderName = 'Unknown';
          if (connectionData) {
            try {
              const clientDataPayload: IClientDataPayload = JSON.parse(connectionData);
              senderName = clientDataPayload.clientData.USERNAME || 'Unknown';
            } catch (parseError) {
              senderName = connectionData.replace('clientData_', '') || 'Unknown';
              console.warn('Failed to parse connectionData as IClientDataPayload for global signal, falling back.', parseError);
            }
          }

          if (signalData.MESSAGE) {
            console.log('Received chat message (global signal):', signalData.MESSAGE);
            const chatMessage: IChatMessage = {
              MESSAGE: signalData.MESSAGE,
              SENDER: signalData.SENDER,
              SENDER_NAME: signalData.SENDER_NAME || senderName,
              SENDER_PICTURE: signalData.SENDER_PICTURE,
              RECEIVER: signalData.RECEIVER,
              TYPE: signalData.TYPE || 'chat',
              TIME: signalData.TIME,
              textColor: signalData.textColor,
              isLocal: false, // Messages received are never local (by this path)
              id: signalData.id || nanoid(), // Use existing ID from signal or generate new one
            };
            addChatMessage(chatMessage);
          }

        } catch (parseError) {
          console.error('Error parsing global chat signal data:', parseError, event.data);
        }
      });
      
      session.on(`signal:${effectiveSessionId}`, (event) => {
        console.log(`Chat message from room ${effectiveSessionId}`, event);
        const localPublisherConnectionId = openViduStore.get().publisher?.stream?.connection?.connectionId;
        const signalSenderConnectionId = event.from?.connectionId;

        // Deduplicate: If the signal sender is our own publisher, skip to prevent double adding.
        if (localPublisherConnectionId && signalSenderConnectionId && localPublisherConnectionId === signalSenderConnectionId) {
            console.log('Received own chat message via room-specific signal, skipping to prevent duplication.');
            return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.MESSAGE) {
            console.log('Received chat message (room-specific signal):', data.MESSAGE);
            const chatMessage: IChatMessage = {
              SENDER_NAME: data.SENDER_NAME,
              SENDER_PICTURE: data.SENDER_PICTURE,
              SENDER: data.SENDER,
              MESSAGE: data.MESSAGE,
              TIME: data.TIME,
              TYPE: data.TYPE,
              textColor: data?.textColor,
              id: data.id || nanoid(), // Use ID from signal data or generate if missing
              isLocal: false, // Messages received are never local (by this path)
            };
            addChatMessage(chatMessage);
          }

        } catch (parseError) {
          console.error('Error parsing room-specific chat signal data:', parseError, event.data);
        }
      });

      session.on("signal:whisper", (event) => {
        console.log('Received whisper message:', event.data);
        const localPublisherConnectionId = openViduStore.get().publisher?.stream?.connection?.connectionId;
        const signalSenderConnectionId = event.from?.connectionId;

        // Deduplicate: If the signal sender is our own publisher, skip.
        if (localPublisherConnectionId && signalSenderConnectionId && localPublisherConnectionId === signalSenderConnectionId) {
            console.log('Received own whisper message via signal, skipping to prevent duplication.');
            return;
        }

        try {
          const data = event.data;
          const from = event.from.data;
          const fromData = JSON.parse(from)
          const encrypted_data = JSON.parse(decrypt(data));
          console.log(JSON.parse(from), JSON.parse(decrypt(data)));
          const chatMessage: IChatMessage = {
              SENDER_NAME: encrypted_data.SENDER_NAME,
              SENDER_PICTURE: encrypted_data.SENDER_PICTURE,
              SENDER: encrypted_data.SENDER,
              MESSAGE: encrypted_data.MESSAGE,
              TIME: encrypted_data.TIME,
              TYPE: encrypted_data.TYPE,
              textColor: encrypted_data?.textColor,
              id: encrypted_data.id || nanoid(), // Use ID from encrypted data or generate
              RECEIVER_NAME: encrypted_data.RECEIVER_NAME,
              RECEIVER: encrypted_data.RECEIVER,
              isLocal: false,
          };
          addChatMessage(chatMessage);
        } catch (parseError) {
          console.error('Error parsing whisper signal data:', parseError, event.data);
        }
      });
      
 
      const userDataString = JSON.stringify({
        clientData: { ...currentUserDisplayName, USERGROUPID: effectiveSessionId, ROOMNAME: "" },
      });
      
      await session.connect(token, userDataString);

      if (connectionRole === 'PUBLISHER' && ovPublisher) {
        //await session.publish(ovPublisher);
      }

      await fetchSessionConnections(effectiveSessionId);

    } catch (error: any) {
      console.error(
        'Error connecting to session:',
        (error as any).code || 'NoErrorCode',
        (error as Error).message || String(error),
        error
      );
      setOpenViduError(`Failed to connect to OpenVidu session: ${error.message || error}`);

      const latestOvSession = openViduStore.get().session;
      const latestOvPublisher = openViduStore.get().publisher;

      if (latestOvSession) {
         latestOvSession.disconnect();
      }
      if (connectionRole === 'PUBLISHER' && latestOvPublisher && typeof latestOvPublisher.destroy === 'function') {
          latestOvPublisher.destroy();
      }
      resetOpenViduStore();
      clearConnections();
      clearChat();
      isMediaInitInProgress.current = false;
    } finally {
      setOpenViduLoading(false);
    }
  }, [getToken, currentUserDisplayName, leaveSession, fetchSessionConnections, clearConnections, connectionRole, clearChat]);

  const toggleCamera = useCallback(() => {
    if (connectionRole === 'SUBSCRIBER') return;

    const currentPublisher = openViduStore.get().publisher;
    const currentIsCameraActive = openViduStore.get().isCameraActive;
    const newCameraState = !currentIsCameraActive;
    setIsCameraActive(newCameraState);
    if (currentPublisher && typeof currentPublisher.publishVideo === 'function') {
      currentPublisher.publishVideo(newCameraState);
    }
  }, [connectionRole]);

  const toggleMic = useCallback(() => {
    if (connectionRole === 'SUBSCRIBER') return;

    const currentPublisher = openViduStore.get().publisher;
    const currentIsMicActive = openViduStore.get().isMicActive;
    const newMicState = !currentIsMicActive;
    setIsMicActive(newMicState);
    if (currentPublisher && typeof currentPublisher.publishAudio === 'function') {
      currentPublisher.publishAudio(newMicState);
    }
  }, [connectionRole]);


  const sendChatMessage = useCallback(async (messageText: string) => {
    const ovSession = openViduStore.get().session;
    const ovCurrentSessionId = openViduStore.get().currentSessionId;

    if (!ovSession || !ovCurrentSessionId) {
      console.warn('Cannot send chat message: No active OpenVidu session.');
      throw new Error('No active OpenVidu session to send message.');
    }
    try {
      const messageId = nanoid(); // Generate ID once at source
      const mySenderName = currentUserDisplayName?.USERNAME || 'You';
      const messagePayload: Omit<IChatMessage, 'isLocal'> = {
        MESSAGE: messageText,
        SENDER: currentUserDisplayName?.USERID?.toString() || 'unknown_user_id',
        SENDER_NAME: mySenderName,
        SENDER_PICTURE: currentUserDisplayName?.PICTURE,
        RECEIVER: undefined,
        TYPE: 'global',
        TIME: Date.now(),
        textColor: undefined,
        id: messageId, // Include generated ID in payload
      };
      console.log(ovSession, 'ovSession');
      await ovSession.signal({
        type: ovSession.sessionId,
        data: JSON.stringify(messagePayload),
      });
      console.log('Sent chat message:', messageText);

      // Optimistically add message to local store with isLocal: true
      addChatMessage({ ...messagePayload, isLocal: true });

    } catch (error: any) {
      console.error('Error sending chat message via OpenVidu signal:', error);
      setOpenViduError(`Failed to send chat message: ${error.message || error}`);
      throw error;
    }
  }, [currentUserDisplayName, addChatMessage]);

  return {
    sessionNameInput: ovState.sessionNameInput,
    handleSessionNameChange,
    joinSession,
    leaveSession,
    initLocalMediaPreview,
    destroyLocalMediaPreview,
    toggleCamera,
    toggleMic,
    sendChatMessage,
    isCameraActive: ovState.isCameraActive,
    isMicActive: ovState.isMicActive,
    isLoading: ovState.loading,
    error: ovState.error,
    publisher: ovState.publisher,
    subscribers: ovState.subscribers,
    currentSessionId: ovState.currentSessionId,
    openViduInstance: ovState.openViduInstance,
    connectionRole,
    currentUserDisplayName,
  };
};
