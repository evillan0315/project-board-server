// src/components/TerminalShellAi
import { createSignal, onCleanup, onMount } from 'solid-js';
import { Terminal } from '@xterm/xterm'; // This import is not strictly needed here as Terminal is managed by the hook
import { FitAddon } from '@xterm/addon-fit'; // This import is not strictly needed here as FitAddon is managed by the hook
import { io, Socket } from 'socket.io-client'; // This import seems unused in the provided snippet
import '@xterm/xterm/css/xterm.css';
import { Button } from './ui/Button';
import { useGeminiTerminal } from '../hooks/useGeminiTerminal'; // Your updated hook

interface TerminalShellProps {
  fontSize?: number;
  autoFocus?: boolean; // Not used in this snippet
  onClose?: () => void;
}

export default function TerminalShellAi(props: TerminalShellProps) {
  let terminalRef!: HTMLDivElement;
  const [height, setHeight] = createSignal(200);
  const [isResizing, setIsResizing] = createSignal(false);

  // Use the updated hook
  const { term, initialize, handleResize, dispose, isProcessingCommand } = useGeminiTerminal({
    fontSize: props.fontSize ?? 12,
    // The 'prompt' prop is no longer directly used by useGeminiTerminal's public interface for display.
    // The prompt is now managed internally by the hook.
  });

  const startResizing = () => {
    setIsResizing(true);
    document.body.style.cursor = 'ns-resize';
  };

  const stopResizing = () => {
    if (isResizing()) {
      setIsResizing(false);
      document.body.style.cursor = '';
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isResizing()) {
      const rect = terminalRef.getBoundingClientRect();
      setHeight(Math.max(100, rect.bottom - e.clientY));
    }
  };

  const closeTerminal = () => props.onClose?.();

  onMount(() => {
    initialize(terminalRef); // Initialize the terminal instance

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResizing);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', stopResizing);
      dispose(); // Clean up xterm.js instance
    });
  });

  return (
    <div class="flex flex-col h-auto transition-all duration-200">
      <div class="h-1 cursor-ns-resize resizer hover:bg-sky-500" onMouseDown={startResizing} />
      {isProcessingCommand() && (
        <div class="flex items-center gap-1">
          <span class="spinner text-sky-400">
            <svg
              class="animate-spin h-4 w-4 text-sky-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
          <span class="text-xs text-yellow-400">(Thinking...)</span>
        </div>
      )}
      <div ref={(el) => (terminalRef = el)} class="text-xs font-mono" style={{ height: `${height()}px` }} />
    </div>
  );
}


Explanation of Changes:

The provided code already sets up the basic structure for a terminal component using @xterm/xterm and a custom hook
useGeminiTerminal. Since the actual typing effect is being handled in the useGeminiTerminal hook and not in the
component itself, this component code does not need to be modified to achieve the typewriter effect. The hook is where
the changes would need to be made.

Important: Modifications needed in useGeminiTerminal (Conceptual)

To achieve the typewriter effect, you need to modify the useGeminiTerminal hook. Here's the general idea:

 1. Buffer Output: Instead of writing directly to the terminal, buffer the output from your AI model.
 2. setInterval or requestAnimationFrame: Use either setInterval or requestAnimationFrame to write characters from the
    buffer to the terminal one at a time (or in small chunks). requestAnimationFrame is generally smoother for UI
    updates.
 3. Delay: Introduce a small delay (e.g., 50-100ms) between writing each character or chunk of characters.
 4. Cursor Handling: Ensure that the terminal cursor is properly updated after each character is written.

Conceptual Code for useGeminiTerminal (Illustrative):

// Example - Assumes you have access to the terminal instance inside the hook
import { createSignal, onMount, onCleanup } from 'solid-js';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

interface UseGeminiTerminalProps {
  fontSize: number;
}

export function useGeminiTerminal(props: UseGeminiTerminalProps) {
  const [isProcessingCommand, setIsProcessingCommand] = createSignal(false);
  let term: Terminal | null = null;
  let fitAddon: FitAddon | null = null;

  const initialize = (terminalRef: HTMLDivElement) => {
    term = new Terminal({
      fontSize: props.fontSize,
      cursorBlink: true,
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef);
    fitAddon.fit();

    // Simulate fetching data from the AI (replace with your actual AI call)
    const simulateAIResponse = () => {
      setIsProcessingCommand(true);
      setTimeout(() => {
        const aiOutput = "This is a simulated AI response.\nIt will be typed out slowly.";
        typewriterEffect(aiOutput); // Call the typewriter function
        setIsProcessingCommand(false);
      }, 1000);
    };


    term.onKey((ev) => {
      const event = ev.domEvent;
      const printable = !event.altKey && !event.ctrlKey && !event.metaKey;

      if (event.key === '\r') {
        // Enter key pressed
        term?.write('\r\n');
        simulateAIResponse(); // Simulate an AI response after the command
      } else if (event.key === '\b') {
        // Backspace key pressed
        if (term?.buffer.active.cursorX > 0) {
          term?.write('\b \b');
        }
      } else if (printable) {
        term?.write(ev.key);
      }
    });
  };

  const typewriterEffect = (text: string, delay = 50) => {
    let index = 0;
    const intervalId = setInterval(() => {
      if (term) {
        if (index < text.length) {
          term.write(text.charAt(index));
          index++;
        } else {
          clearInterval(intervalId);
        }
      } else {
        clearInterval(intervalId); // Clear if terminal is unmounted
      }

    }, delay);

    return () => clearInterval(intervalId); // Return a cleanup function
  };



  const handleResize = () => {
    fitAddon?.fit();
  };

  const dispose = () => {
    term?.dispose();
    term = null;
    fitAddon = null;
  };


  return {
    term,
    initialize,
    handleResize,
    dispose,
    isProcessingCommand,
  };
}


Key points:

 * typewriterEffect Function: This function is the core of the typewriter effect. It takes the text to be displayed and
   an optional delay. It uses setInterval to write one character at a time to the terminal. Critically, it clears the
   interval when the text is finished or if the component is unmounted (to prevent memory leaks).
 * Simulated AI Response: The simulateAIResponse function shows how you would trigger the typewriter effect after
   simulating a command execution. Replace this with your actual AI call.
 * Cleanup: Make sure to clear the interval in the dispose function to prevent errors when the component unmounts.
 * Error Handling: Add error handling to the typewriterEffect function to gracefully handle cases where the terminal is
   no longer available.

To use this:

 1. Replace Placeholder: Replace the simulateAIResponse and typewriterEffect parts with your actual Gemini API calls and
    the logic to handle the responses.
 2. Adjust Delay: Adjust the delay value in the typewriterEffect function to control the speed of the typing animation.
 3. Integrate Properly: Make sure that the AI calls are correctly integrated with the terminal and that the responses
    are displayed in the correct format.

This complete example provides a solid foundation for creating a typewriter effect in your Solid.js terminal component.
Remember to adapt the AI call and adjust the delay to suit your specific needs. Remember to handle errors and cleanup
resources properly to avoid memory leaks and unexpected behavior.