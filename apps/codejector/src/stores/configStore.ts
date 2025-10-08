import { nanoid } from 'nanoid';
import { addLog } from '@/stores/logStore';

import { atom } from 'nanostores';
import type { ITheme } from '@xterm/xterm';

interface TerminalTheme extends ITheme {
  // Can add custom theme properties here if needed
}

interface ConfigStoreState {
  // ... other global configurations
  terminalSettings: {
    fontSize: number;
    fontFamily: string;
    theme: TerminalTheme;
  };
}

export const configStore = atom<ConfigStoreState>({
  terminalSettings: {
    fontSize: 14,
    fontFamily: 'monospace',
    theme: {
      background: '#000000',
      foreground: '#F8F8F8',
      cursor: '#F8F8F8',
      selectionBackground: 'rgba(255, 255, 255, 0.3)',
      // Add other default theme properties as needed
    },
  },
  // ... initial values for other configs
});

export function setTerminalFontSize(size: number) {
  configStore.setKey('terminalSettings', {
    ...configStore.get().terminalSettings,
    fontSize: size,
  });
}

export function setTerminalFontFamily(fontFamily: string) {
  configStore.setKey('terminalSettings', {
    ...configStore.get().terminalSettings,
    fontFamily: fontFamily,
  });
}

export function setTerminalTheme(theme: TerminalTheme) {
  configStore.setKey('terminalSettings', {
    ...configStore.get().terminalSettings,
    theme: theme,
  });
}

export const createUniquetId = () => {
  const requestId = nanoid();
  addLog('LLM', `Created request with ID: ${requestId}`, 'debug');
  return requestId;
};
