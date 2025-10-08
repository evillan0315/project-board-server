/**
 * FilePath: src/hooks/useWebSocket.ts
 * Title: WebSocket connection hook (React + TypeScript)
 * Reason: Establish a typed WebSocket connection to the given endpoint and manage lifecycle within React.
 */

import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  payload?: any;
}

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected:', url);
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        console.warn('⚠️ Received non-JSON message:', event.data);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = (msg: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('Cannot send message — WebSocket not open.');
    }
  };

  return { isConnected, messages, sendMessage };
}
