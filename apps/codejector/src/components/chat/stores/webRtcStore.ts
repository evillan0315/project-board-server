/**
 * @file Nanostore for WebRTC functionality, centralizing state and logic for video chat.
 */

import { atom } from 'nanostores';
import adapter from 'webrtc-adapter'; // For browser compatibility
import { webRtcSignalingSocketService } from '../webRtcSignalingSocketService'; // Import the new signaling service
import { PeerConnectionState, RemoteVideoFeed, PeerInfo } from '../types';
import { getToken } from '@/stores/authStore';

// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // You might add more STUN/TURN servers here for better reliability
  ],
};

/**
 * WebRtcStore encapsulates all WebRTC- related state and logic using Nanostores.
 * This allows for global, reactive access to video chat state without prop drilling
 * and separates WebRTC concerns from React components.
 */
class WebRtcStore {
  // Publicly accessible atoms for React components to consume via useStore
  public localStream = atom<MediaStream | null>(null);
  public remoteStreams = atom<RemoteVideoFeed[]>([]);
  public isAudioMuted = atom<boolean>(false);
  public isVideoMuted = atom<boolean>(false);
  public error = atom<string | null>(null);
  public isLoading = atom<boolean>(false);

  // Private internal state not directly exposed as atoms, but managed by the store
  private peerConnections = new Map<string, PeerConnectionState>();
  private localStreamRef: MediaStream | null = null; // Direct reference for easier track manipulation
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;

  constructor() {
    // Initialize adapter for browser compatibility (can be called once)
    adapter.browserDetails;
  }

  /**
   * Helper to set the local media stream and its mute states.
   */
  private setLocalMediaStream(stream: MediaStream | null) {
    this.localStreamRef = stream;
    this.localStream.set(stream);
  }

  /**
   * Creates a new RTCPeerConnection and sets up its event handlers.
   */
  private createPeerConnection = (peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && this.currentRoomId) {
        console.log(`[WebRTC Store] Sending ICE candidate to ${peerId}`);
        webRtcSignalingSocketService.sendCandidate({
          roomId: this.currentRoomId,
          targetUserId: peerId,
          payload: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC Store] Track received from ${peerId}:`, event.track.kind);
      this.remoteStreams.set(
        ((prev) => {
          const existing = prev.find((stream) => stream.peerId === peerId);
          if (existing) {
            // Update existing stream if tracks are added/removed (rare for single peer stream)
            return prev.map((s) =>
              s.peerId === peerId ? { ...s, stream: event.streams[0] } : s,
            );
          } else {
            return [...prev, { peerId, stream: event.streams[0] }];
          }
        })(this.remoteStreams.get()), // Pass current value to updater function
      );

      // Store remote audio/video tracks for potential future control
      this.peerConnections.set(peerId, {
        ...this.peerConnections.get(peerId)!,
        remoteStream: event.streams[0],
        ...(event.track.kind === 'audio' && { remoteAudioTrack: event.track }),
        ...(event.track.kind === 'video' && { remoteVideoTrack: event.track }),
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(
        `[WebRTC Store] Peer connection state for ${peerId}: ${pc.connectionState}`,
      );
      if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed' ||
        pc.connectionState === 'closed'
      ) {
        this.removePeer(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(
        `[WebRTC Store] ICE connection state for ${peerId}: ${pc.iceConnectionstate}`,
      );
    };

    // Add local tracks to the new peer connection
    // Ensure tracks are only added if they are not already part of a sender on this peer connection.
    if (this.localStreamRef) {
      const existingSenders = pc.getSenders();
      this.localStreamRef.getTracks().forEach((track) => {
        // Check if a sender for this track already exists on this RTCPeerConnection
        const hasSenderForTrack = existingSenders.some(
          (sender) => sender.track && sender.track.id === track.id,
        );
        if (!hasSenderForTrack) {
          pc.addTrack(track, this.localStreamRef!);
          console.log(`[WebRTC Store] Added track ${track.kind} (${track.id}) to peer connection for ${peerId}`);
        } else {
          console.log(`[WebRTC Store] Track ${track.kind} (${track.id}) already managed by a sender on PC, skipping addTrack.`);
        }
      });
    }

    this.peerConnections.set(peerId, {
      peerId,
      connection: pc,
      remoteStream: null,
      remoteAudioTrack: null,
      remoteVideoTrack: null,
    });
    return pc;
  };

  /**
   * Removes a peer connection and its associated remote stream.
   */
  private removePeer = (peerId: string) => {
    const pcState = this.peerConnections.get(peerId);
    if (pcState) {
      pcState.connection.close();
      this.peerConnections.delete(peerId);
      this.remoteStreams.set(
        this.remoteStreams.get().filter((stream) => stream.peerId !== peerId),
      );
      console.log(`[WebRTC Store] Peer ${peerId} connection closed and removed.`);
    }
  };

  /**
   * Handles the 'user_joined' WebSocket event, initiating an offer if needed.
   */
  private handleUserJoined = async ({
    socketId,
    userId,
  }: {socketId: string; userId?: string}) => {
    //if (socketId === this.currentUserId) return; // Don't connect to self

    console.log(`[WebRTC Store] User ${userId} (${socketId}) joined the room.`);

    let pcState = this.peerConnections.get(socketId);
    let pc: RTCPeerConnection;

    if (pcState) {
      pc = pcState.connection;
      if (pc.signalingState !== 'stable') {
        console.warn(
          `[WebRTC Store] Peer connection for ${socketId} is in state '${pc.signalingState}', not creating a new offer.`,
        );
        return;
      }
    } else {
      pc = this.createPeerConnection(socketId);
    }

    try {
      console.log(
        `[WebRTC Store] Creating offer for ${socketId}. Signaling state: ${pc.signalingState}`,
      );
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log(
        `[WebRTC Store] Local offer set for ${socketId}. Signaling state: ${pc.signalingState}`,
      );
      webRtcSignalingSocketService.sendOffer({
        roomId: this.currentRoomId!,
        targetUserId: socketId,
        payload: pc.localDescription,
      });
      console.log(`[WebRTC Store] Offer sent to ${socketId}`);
    } catch (err) {
      console.error(`[WebRTC Store] Error creating offer for ${socketId}:`, err);
      let errorMessage = `Failed to create offer for ${userId || socketId}.`;
      if (err instanceof DOMException) {
        errorMessage = `Failed to create offer for ${userId || socketId}. Details: ${err.message}`;
      }
      this.error.set(errorMessage);
    }
  };

  /**
   * Handles receiving a WebRTC offer, creating and sending an answer.
   */
  private handleReceiveOffer = async ({
    senderSocketId,
    offer,
  }: {senderSocketId: string; offer: RTCSessionDescriptionInit}) => {
    if (senderSocketId === this.currentUserId) return; // Offer from self

    console.log(
      `[WebRTC Store] Received offer from ${senderSocketId}. Current signaling state: ${this.peerConnections.get(senderSocketId)?.connection?.signalingState || 'N/A (new)'}`,
    );

    const pc = this.peerConnections.get(senderSocketId)?.connection || this.createPeerConnection(senderSocketId);
    if (!pc) {
      this.error.set(
        `Failed to get/create peer connection for offer from ${senderSocketId}.`,
      );
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log(
        `[WebRTC Store] Remote description (offer) set for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );

      if (
        pc.signalingState !== 'have-remote-offer' &&
        pc.signalingState !== 'have-local-pranswer'
      ) {
        const msg =
          `[WebRTC Store] Signaling state for ${senderSocketId} is ${pc.signalingState} after setting remote offer. Expected 'have-remote-offer'. Aborting answer creation.`;
        console.error(msg);
        this.error.set(
          `Failed to process offer from ${senderSocketId}: unexpected signaling state (${pc.signalingState}).`,
        );
        return;
      }

      console.log(
        `[WebRTC Store] Creating answer for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );
      const answer = await pc.createAnswer();
      console.log(
        `[WebRTC Store] Created answer for ${senderSocketId}. Answer type: ${answer.type}.`,
      );

      console.log(
        `[WebRTC Store] Setting local description (answer) for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );
      await pc.setLocalDescription(answer);
      console.log(
        `[WebRTC Store] Local description (answer) set for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );

      webRtcSignalingSocketService.sendAnswer({
        roomId: this.currentRoomId!,
        targetUserId: senderSocketId,
        payload: pc.localDescription,
      });
      console.log(`[WebRTC Store] Answer sent to ${senderSocketId}`);
    } catch (err) {
      console.error(`[WebRTC Store] Error handling offer from ${senderSocketId}:`, err);
      let errorMessage = `Failed to process offer from ${senderSocketId}.`;
      if (err instanceof DOMException) {
        errorMessage = `Failed to process offer from ${senderSocketId}: ${err.message}`;
      }
      this.error.set(errorMessage);
    }
  };

  /**
   * Handles receiving a WebRTC answer, setting it as remote description.
   */
  private handleReceiveAnswer = async ({
    senderSocketId,
    answer,
  }: {senderSocketId: string; answer: RTCSessionDescriptionInit}) => {
    if (senderSocketId === this.currentUserId) return; // Answer from self

    console.log(
      `[WebRTC Store] Received answer from ${senderSocketId}. Current signaling state: ${this.peerConnections.get(senderSocketId)?.connection?.signalingState}`,
    );

    const pc = this.peerConnections.get(senderSocketId)?.connection;
    if (!pc) {
      this.error.set(
        `Failed to get peer connection for answer from ${senderSocketId}.`,
      );
      return;
    }

    if (pc.signalingState === 'stable' || pc.signalingState === 'closed') {
      console.warn(
        `[WebRTC Store] Ignoring answer from ${senderSocketId}: signalingState is already '${pc.signalingState}'.`,
      );
      return;
    }

    if (!pc.localDescription) {
      console.warn(
        `[WebRTC Store] Received answer from ${senderSocketId} but no local description (offer) was set. Signaling state: ${pc.signalingState}`,
      );
      this.error.set(
        `Received answer from ${senderSocketId} without a pending local offer.`,
      );
      return;
    }

    try {
      console.log(
        `[WebRTC Store] Setting remote description (answer) for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(
        `[WebRTC Store] Remote description (answer) set for ${senderSocketId}. Signaling state: ${pc.signalingState}`,
      );
    } catch (err) {
      console.error(`[WebRTC Store] Error handling answer from ${senderSocketId}:`, err);
      let errorMessage = `Failed to process answer from ${senderSocketId}.`;
      if (err instanceof DOMException) {
        errorMessage = `Failed to process answer from ${senderSocketId}: ${err.message}`;
      }
      this.error.set(errorMessage);
    }
  };

  /**
   * Handles receiving an ICE candidate, adding it to the peer connection.
   */
  private handleReceiveCandidate = async ({
    senderSocketId,
    candidate,
  }: {senderSocketId: string; candidate: RTCIceCandidate}) => {
    if (senderSocketId === this.currentUserId) return; // Candidate from self

    console.log(`[WebRTC Store] Received ICE candidate from ${senderSocketId}`);

    const pc = this.peerConnections.get(senderSocketId)?.connection;
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log(`[WebRTC Store] ICE candidate added for ${senderSocketId}`);
      } catch (err) {
        console.error(`[WebRTC Store] Error adding ICE candidate from ${senderSocketId}:`, err);
        let errorMessage = `Failed to add ICE candidate from ${senderSocketId}.`;
        if (err instanceof DOMException) {
          errorMessage = `Failed to add ICE candidate from ${senderSocketId}: ${err.message}`;
        }
        this.error.set(errorMessage);
      }
    }
  };

  /**
   * Handles the 'user_left' WebSocket event, removing the disconnected peer.
   */
  private handleUserLeft = ({ socketId }: { socketId: string }) => {
    console.log(`[WebRTC Store] User ${socketId} left the room.`);
    this.removePeer(socketId);
  };

  /**
   * Handles the 'existing_users_in_room' WebSocket event, initiating offers to all existing peers.
   */
  private handleExistingUsersInRoom = async (users: PeerInfo[]) => {
    console.log('[WebRTC Store] Existing users in room:', users);

    for (const user of users) {
      if (user.socketId === this.currentUserId) continue; // Don't connect to self

      let pcState = this.peerConnections.get(user.socketId);
      let pc: RTCPeerConnection;

      if (pcState) {
        pc = pcState.connection;
        if (pc.signalingState !== 'stable') {
          console.warn(
            `[WebRTC Store] Peer connection for existing user ${user.socketId} is in state '${pc.signalingState}', not creating a new offer.`,
          );
          continue;
        }
      } else {
        pc = this.createPeerConnection(user.socketId);
      }

      try {
        console.log(
          `[WebRTC Store] Creating offer for existing user ${user.socketId}. Signaling state: ${pc.signalingState}`,
        );
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log(
          `[WebRTC Store] Local offer set for existing user ${user.socketId}. Signaling state: ${pc.signalingState}`,
        );
        webRtcSignalingSocketService.sendOffer({
          roomId: this.currentRoomId!,
          targetUserId: user.socketId,
          payload: pc.localDescription,
        });
        console.log(`[WebRTC Store] Offer sent to existing user ${user.socketId}`);
      } catch (err) {
        console.error(
          `[WebRTC Store] Error creating offer for existing user ${user.socketId}:`,
          err,
        );
        let errorMessage = `Failed to create offer for ${user.socketId}.`;
        if (err instanceof DOMException) {
          errorMessage = `Failed to create offer for ${user.socketId}. Details: ${err.message}`;
        }
        this.error.set(errorMessage);
      }
    }
  };

  /**
   * Requests access to local media (camera and microphone).
   */
  private getLocalMedia = async () => {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.setLocalMediaStream(stream);

      stream.getAudioTracks().forEach((track) => (track.enabled = !this.isAudioMuted.get()));
      stream.getVideoTracks().forEach((track) => (track.enabled = !this.isVideoMuted.get()));

      console.log('[WebRTC Store] Local media stream obtained.');
    } catch (err) {
      console.error('[WebRTC Store] Error accessing local media:', err);
      let errorMessage = 'Failed to access camera and/or microphone. Please check permissions.';
      if (err instanceof DOMException) {
        errorMessage = `Failed to access local media: ${err.message}`;
      }
      this.error.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  };

  /**
   * Toggles the local audio track's mute state.
   */
  public toggleAudio = () => {
    if (this.localStreamRef) {
      const enabled = !this.isAudioMuted.get();
      this.localStreamRef.getAudioTracks().forEach((track) => (track.enabled = enabled));
      this.isAudioMuted.set(!enabled);
      console.log(`[WebRTC Store] Local audio ${enabled ? 'unmuted' : 'muted'}.`);
    }
  };

  /**
   * Toggles the local video track's mute state.
   */
  public toggleVideo = () => {
    if (this.localStreamRef) {
      const enabled = !this.isVideoMuted.get();
      this.localStreamRef.getVideoTracks().forEach((track) => (track.enabled = enabled));
      this.isVideoMuted.set(!enabled);
      console.log(`[WebRTC Store] Local video ${enabled ? 'unmuted' : 'muted'}.`);
    }
  };

  /**
   * Disconnects all WebRTC peer connections and stops local media.
   * Does NOT disconnect the main chat socket, as it's used for chat as well.
   */
  public disconnect = () => {
    // Close all peer connections
    this.peerConnections.forEach((pcState) => pcState.connection.close());
    this.peerConnections.clear();
    this.remoteStreams.set([]);

    // Stop local media tracks
    if (this.localStreamRef) {
      this.localStreamRef.getTracks().forEach((track) => track.stop());
      this.setLocalMediaStream(null);
    }

    this.currentRoomId = null;

    // Remove WebRTC-specific socket listeners
    webRtcSignalingSocketService.off('user_joined');
    webRtcSignalingSocketService.off('receive_offer');
    webRtcSignalingSocketService.off('receive_answer');
    webRtcSignalingSocketService.off('receive_candidate');
    webRtcSignalingSocketService.off('user_left');
    webRtcSignalingSocketService.off('existing_users_in_room');

    webRtcSignalingSocketService.disconnect(); // Disconnect the signaling socket

    console.log('[WebRTC Store] Disconnected from video chat.');
  };

  /**
   * Connects to a video chat room, gets local media, and registers socket listeners.
   * @param roomId The ID of the video chat room.
   * @param userId The ID of the current user.
   * @param token The authentication token.
   */
  public connect = async (roomId: string, token: string, userId?: string) => {
    // If already connected to this room, do nothing
    if (this.currentRoomId === roomId && this.localStreamRef) {
      console.log(`[WebRTC Store] Already connected to room ${roomId}`);
      return;
    }

    if (!userId) {
      this.error.set('User ID is required to connect to video chat.');
      return;
    }
    this.currentUserId = userId;
    this.currentRoomId = roomId;

    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Ensure WebRTC signaling socket is connected.
      if (!webRtcSignalingSocketService.isConnected()) {
        await webRtcSignalingSocketService.connect(token);
        console.log('[WebRTC Store] webRtcSignalingSocketService connected for video signaling');
      }

      await this.getLocalMedia();

      webRtcSignalingSocketService.joinRoom({
        roomId: roomId,
        userId: this.currentUserId, // Backend expects userId
      });

      // Register WebSocket listeners for WebRTC signaling
      webRtcSignalingSocketService.on('user_joined', this.handleUserJoined);
      webRtcSignalingSocketService.on('receive_offer', this.handleReceiveOffer);
      webRtcSignalingSocketService.on('receive_answer', this.handleReceiveAnswer);
      webRtcSignalingSocketService.on('receive_candidate', this.handleReceiveCandidate);
      webRtcSignalingSocketService.on('user_left', this.handleUserLeft);
      webRtcSignalingSocketService.on('existing_users_in_room', this.handleExistingUsersInRoom);

      console.log(`[WebRTC Store] Attempting to join video room: ${roomId}`);
    } catch (err) {
      console.error('[WebRTC Store] Error connecting to video chat:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to connect to video chat.';
      if (err instanceof DOMException) {
        errorMessage = `Failed to connect to video chat: ${err.message}`;
      }
      this.error.set(errorMessage);
      this.disconnect(); // Ensure clean up if connection fails
    } finally {
      this.isLoading.set(false);
    }
  };
}

export const webRtcStore = new WebRtcStore();
