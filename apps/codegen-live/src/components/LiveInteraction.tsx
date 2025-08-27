import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { liveStore, resetLiveInteraction, setInitialPromptInput } from '../stores/liveStore';
import { useLiveSocket } from '../hooks/useLiveSocket';

const LiveInteraction: React.FC = () => {
  const {
    isConnected,
    isRecording,
    messages,
    aiSpeaking,
    conversationId,
    error,
    isLoading,
    initialPromptInput,
  } = useStore(liveStore);

  const { startLiveRecording, stopLiveRecording, disconnectSocket, startLiveSession } =
    useLiveSocket({
      websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000/gemini',
    });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialPromptInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages whenever they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus on the initial prompt input when component mounts if no conversation is active
  useEffect(() => {
    if (initialPromptInputRef.current && !conversationId) {
      initialPromptInputRef.current.focus();
    }
  }, [conversationId]);

  const handleStartRecordingClick = () => {
    if (!isConnected) {
      alert('Not connected to the server. Please wait or refresh.');
      return;
    }
    if (isRecording) {
      stopLiveRecording();
    } else {
      // If no conversationId exists, start a new session with initial prompt
      // otherwise, resume recording within the existing session
      if (!conversationId) {
        // Reset messages only if starting a brand new conversation
        resetLiveInteraction();
        startLiveSession(initialPromptInput);
      } else {
        startLiveRecording(conversationId);
      }
    }
  };

  const handleInitialPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInitialPromptInput(e.target.value);
  };

  const handleSendInitialPrompt = () => {
    if (!isConnected) {
      alert('Not connected to the server. Please wait or refresh.');
      return;
    }
    if (initialPromptInput.trim()) {
      // If no conversation ID, start a new session with this prompt
      if (!conversationId) {
        resetLiveInteraction(); // Clear previous state for a new convo
        startLiveSession(initialPromptInput);
      } else {
        // If conversation ID exists, send it as a regular message (not an initial prompt)
        // This part would need a new socket event like 'textInput' if direct text messages are allowed mid-conversation
        // For now, only initial text prompt and continuous audio are supported for simplicity.
        alert(
          'Please use the microphone for ongoing conversation, or reset to start a new text conversation.',
        );
      }
      setInitialPromptInput(''); // Clear input after sending
    }
  };

  const handleReset = () => {
    disconnectSocket();
    resetLiveInteraction();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Gemini Live Interaction</h1>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div
          className={`px-4 py-2 rounded-lg font-medium ${
            isConnected ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          Status: {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
        </div>
        {conversationId && ( // Display full conversation ID for clarity
          <div className="px-4 py-2 rounded-lg bg-gray-700 font-medium">
            Session ID: <span className="font-mono text-sm">{conversationId}</span>
          </div>
        )}
        {isRecording && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Recording...
          </div>
        )}
        {aiSpeaking && (
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-bounce inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            AI Speaking...
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-800 text-white p-3 rounded-lg mb-4 text-center animate-pulse">
          Error: {error}
        </div>
      )}

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Video Placeholder (remains mostly the same, could be enhanced with actual video stream) */}
        <div className="bg-gray-800 rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden">
          <video className="w-full h-full object-cover" autoPlay muted playsInline>
            {/* Add your video stream source here if applicable */}
            {/* <source src="your-video-stream-url" type="video/webm" /> */}
          </video>
          {!isRecording && !aiSpeaking && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-gray-400 text-lg">
              Video Feed Placeholder
            </div>
          )}
        </div>

        {/* Chat / Transcript Area */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Conversation</h2>
          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {messages.length === 0 && !isLoading && !isRecording && (
              <p className="text-gray-400 text-center py-4">
                Start recording or send an initial prompt to begin.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-prose ${msg.role === 'user' ? 'bg-blue-700 text-white' : 'bg-green-700 text-white'}`}
                >
                  <p
                    className={`font-medium mb-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-green-100'}`}
                  >
                    {msg.role === 'user' ? 'You:' : 'AI:'}
                  </p>
                  <p>{msg.content}</p>
                  {msg.isTyping && msg.role === 'ai' && (
                    <span
                      className="inline-block w-2 h-2 ml-2 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Initial Prompt Input */}
          <div className="mt-4 flex gap-2">
            <input
              ref={initialPromptInputRef}
              type="text"
              value={initialPromptInput}
              onChange={handleInitialPromptChange}
              placeholder="Type an initial prompt..."
              className="flex-grow p-3 rounded-lg bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendInitialPrompt();
              }}
              disabled={
                isRecording ||
                isLoading ||
                !isConnected ||
                (conversationId !== null && initialPromptInput.trim() !== '')
              } // Disable if conversation active and has text
            />
            <button
              onClick={handleSendInitialPrompt}
              className="py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200"
              disabled={
                isRecording ||
                isLoading ||
                !isConnected ||
                !initialPromptInput.trim() ||
                conversationId !== null
              }
            >
              Send Initial Prompt
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleStartRecordingClick}
          className={`py-3 px-6 rounded-lg text-lg font-bold transition-colors duration-200 ${isLoading || !isConnected ? 'bg-gray-500 cursor-not-allowed' : isRecording ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          disabled={isLoading || !isConnected}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          onClick={handleReset}
          className="py-3 px-6 rounded-lg text-lg font-bold bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Reset Session
        </button>
      </div>
    </div>
  );
};

export default LiveInteraction;
