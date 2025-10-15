/**
 * @file Custom React hook for WebRTC functionality, handling peer connections and signaling.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import adapter from 'webrtc-adapter'; // For browser compatibility
import { chatSocketService } from './chatSocketService';
import { PeerConnectionState, RemoteVideoFeed, UseWebRTCHooksResult } from './types';
import { getToken } from '@/stores/authStore';

// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // You might add more STUN/TURN servers here for better reliability
  ],
};

/**
 * Custom React hook to manage WebRTC peer connections and media streams.
 * Handles local media, peer connections for multiple remote users, and signaling via WebSocket.
 */
export const useWebRTC = (currentUserId: string): UseWebRTCHooksResult => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteVideoFeed[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Use refs to hold mutable RTCPeerConnection objects without triggering re-renders
  const peerConnections = useRef<Map<string, PeerConnectionState>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // --- Helper Functions ---

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${peerId}`);
        chatSocketService.sendCandidate({
          roomId: roomIdRef.current!,
          targetUserId: peerId,
          payload: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`Track received from ${peerId}:`, event.track.kind);
      setRemoteStreams((prev) => {
        const existing = prev.find((stream) => stream.peerId === peerId);
        if (existing) {
          // Update existing stream if tracks are added/removed (rare for single peer stream)
          // For simplicity, we create a new stream if not existing, otherwise update tracks if needed
          return prev.map(s => s.peerId === peerId ? { ...s, stream: event.streams[0] } : s);
        } else {
          return [...prev, { peerId, stream: event.streams[0] }];
        }
      });

      // Store remote audio/video tracks for potential future control (e.g., muting client-side)
      peerConnections.current.set(peerId, {
        ...peerConnections.current.get(peerId)!,
        remoteStream: event.streams[0],
        ...(event.track.kind === 'audio' && { remoteAudioTrack: event.track }),
        ...(event.track.kind === 'video' && { remoteVideoTrack: event.track }),
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state for ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        // Handle peer disconnection or failure
        removePeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}: ${pc.iceConnectionState}`);
    };

    // Add local tracks to the new peer connection
    localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));

    peerConnections.current.set(peerId, { peerId, connection: pc, remoteStream: null, remoteAudioTrack: null, remoteVideoTrack: null });
    return pc;
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const pcState = peerConnections.current.get(peerId);
    if (pcState) {
      pcState.connection.close();
      peerConnections.current.delete(peerId);
      setRemoteStreams((prev) => prev.filter((stream) => stream.peerId !== peerId));
      console.log(`Peer ${peerId} connection closed and removed.`);
    }
  }, []);

  const handleUserJoined = useCallback(async ({ socketId, userId }: { socketId: string, userId?: string }) => {
    if (socketId === currentUserId) return; // Don't connect to self
    if (peerConnections.current.has(socketId)) return; // Already connected

    console.log(`User ${userId} (${socketId}) joined the room.`);

    const pc = createPeerConnection(socketId);
    if (!pc) return; // Should not happen with createPeerConnection logic

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      chatSocketService.sendOffer({
        roomId: roomIdRef.current!,
        targetUserId: socketId,
        payload: pc.localDescription,
      });
      console.log(`Offer sent to ${socketId}`);
    } catch (err) {
      console.error(`Error creating offer for ${socketId}:`, err);
      setError(`Failed to create offer for ${userId}.`);
    }
  }, [currentUserId, createPeerConnection]);

  const handleReceiveOffer = useCallback(async ({ senderSocketId, offer }: { senderSocketId: string, offer: RTCSessionDescriptionInit }) => {
    if (senderSocketId === currentUserId) return; // Offer from self

    console.log(`Received offer from ${senderSocketId}`);

    const pc = peerConnections.current.get(senderSocketId)?.connection || createPeerConnection(senderSocketId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      chatSocketService.sendAnswer({
        roomId: roomIdRef.current!,
        targetUserId: senderSocketId,
        payload: pc.localDescription,
      });
      console.log(`Answer sent to ${senderSocketId}`);
    } catch (err) {
      console.error(`Error handling offer from ${senderSocketId}:`, err);
      setError(`Failed to process offer from ${senderSocketId}.`);
    }
  }, [currentUserId, createPeerConnection]);

  const handleReceiveAnswer = useCallback(async ({ senderSocketId, answer }: { senderSocketId: string, answer: RTCSessionDescriptionInit }) => {
    if (senderSocketId === currentUserId) return; // Answer from self

    console.log(`Received answer from ${senderSocketId}`);

    const pc = peerConnections.current.get(senderSocketId)?.connection;
    if (pc && pc.localDescription) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`Remote description set for ${senderSocketId}`);
      } catch (err) {
        console.error(`Error handling answer from ${senderSocketId}:`, err);
        setError(`Failed to process answer from ${senderSocketId}.`);
      }
    }
  }, [currentUserId]);

  const handleReceiveCandidate = useCallback(async ({ senderSocketId, candidate }: { senderSocketId: string, candidate: RTCIceCandidate }) => {
    if (senderSocketId === currentUserId) return; // Candidate from self

    console.log(`Received ICE candidate from ${senderSocketId}`);

    const pc = peerConnections.current.get(senderSocketId)?.connection;
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`ICE candidate added for ${senderSocketId}`);
      } catch (err) {
        console.error(`Error adding ICE candidate from ${senderSocketId}:`, err);
        setError(`Failed to add ICE candidate from ${senderSocketId}.`);
      }
    }
  }, [currentUserId]);

  const handleUserLeft = useCallback(({ socketId }: { socketId: string }) => {
    console.log(`User ${socketId} left the room.`);
    removePeer(socketId);
  }, [removePeer]);

  const handleExistingUsersInRoom = useCallback(async (users: PeerInfo[]) => {
    console.log('Existing users in room:', users);
    // For each existing user, if we are not already connected, create an offer
    for (const user of users) {
      if (user.socketId !== currentUserId && !peerConnections.current.has(user.socketId)) {
        console.log(`Connecting to existing user: ${user.socketId}`);
        const pc = createPeerConnection(user.socketId);
        if (!pc) continue;

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          chatSocketService.sendOffer({
            roomId: roomIdRef.current!,
            targetUserId: user.socketId,
            payload: pc.localDescription,
          });
          console.log(`Offer sent to ${user.socketId}`);
        } catch (err) {
          console.error(`Error creating offer for existing user ${user.socketId}:`, err);
          setError(`Failed to create offer for ${user.socketId}.`);
        }
      }
    }
  }, [currentUserId, createPeerConnection]);


  // --- Media Stream Management Functions ---

  const getLocalMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      stream.getAudioTracks().forEach((track) => (track.enabled = !isAudioMuted));
      stream.getVideoTracks().forEach((track) => (track.enabled = !isVideoMuted));

      console.log('Local media stream obtained.');
    } catch (err) {
      console.error('Error accessing local media:', err);
      setError('Failed to access camera and/or microphone. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  }, [isAudioMuted, isVideoMuted]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isAudioMuted;
      localStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = enabled));
      setIsAudioMuted(!enabled);
      console.log(`Local audio ${enabled ? 'unmuted' : 'muted'}.`);
    }
  }, [isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const enabled = !isVideoMuted;
      localStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = enabled));
      setIsVideoMuted(!enabled);
      console.log(`Local video ${enabled ? 'unmuted' : 'muted'}.`);
    }
  }, [isVideoMuted]);

  const disconnect = useCallback(() => {
    // Close all peer connections
    peerConnections.current.forEach((pcState) => pcState.connection.close());
    peerConnections.current.clear();
    setRemoteStreams([]);

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      localStreamRef.current = null;
    }
    
    // Leave the room via WebSocket
    if (roomIdRef.current) {
      // chatSocketService doesn't have an explicit 'leave_room' for video, but disconnecting from WS will handle it
      // For now, we assume disconnecting the socket is sufficient for a full hang-up.
      // A 'leave_room' explicit emit could be added to backend if needed for persistent room states.
      roomIdRef.current = null;
    }

    if (chatSocketService.isConnected()) {
        chatSocketService.disconnect();
    }

    console.log('Disconnected from video chat.');
  }, []);

  const connect = useCallback(async (roomId: string, token: string) => {
    if (!currentUserId) {
      setError('User ID is required to connect to video chat.');
      return;
    }
    roomIdRef.current = roomId;

    try {
      setIsLoading(true);
      setError(null);

      await chatSocketService.connect(token);

      await getLocalMedia();

      chatSocketService.joinVideoRoom({
        roomId: roomId,
        userId: currentUserId, // Backend expects userId
      });

      // Register WebSocket listeners
      chatSocketService.on('user_joined', handleUserJoined);
      chatSocketService.on('receive_offer', handleReceiveOffer);
      chatSocketService.on('receive_answer', handleReceiveAnswer);
      chatSocketService.on('receive_candidate', handleReceiveCandidate);
      chatSocketService.on('user_left', handleUserLeft);
      chatSocketService.on('existing_users_in_room', handleExistingUsersInRoom);

      console.log(`Attempting to join video room: ${roomId}`);
    } catch (err) {
      console.error('Error connecting to video chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to video chat.');
      disconnect(); // Ensure clean up if connection fails
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, getLocalMedia, disconnect, handleUserJoined, handleReceiveOffer, handleReceiveAnswer, handleReceiveCandidate, handleUserLeft, handleExistingUsersInRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('useWebRTC cleanup running...');
      disconnect();
      // Ensure socket listeners are removed
      chatSocketService.off('user_joined');
      chatSocketService.off('receive_offer');
      chatSocketService.off('receive_answer');
      chatSocketService.off('receive_candidate');
      chatSocketService.off('user_left');
      chatSocketService.off('existing_users_in_room');
    };
  }, [disconnect]);

  return {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoMuted,
    error,
    isLoading,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
  };
};
