/**
 * FilePath: src/components/WebSocketDemo.tsx
 * Title: WebSocket Demo Component
 * Reason: Demonstrate connection and message exchange via useWebSocket hook.
 */

import React, { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function WebSocketDemo() {
  const { isConnected, messages, sendMessage } = useWebSocket(
    'wss://viduk.swinglifestyle.com?sessionId=bdsm&token=tok_ZX1tNBg6X8OXPj1o'
  );

  useEffect(() => {
    if (isConnected) {
      sendMessage({ type: 'ping', payload: 'Hello Server!' });
    }
  }, [isConnected]);

  return (
    <div>
      <h3>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</h3>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            <strong>{msg.type}:</strong> {JSON.stringify(msg.payload)}
          </li>
        ))}
      </ul>
    </div>
  );
}
