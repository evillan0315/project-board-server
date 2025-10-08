import { map } from 'nanostores';
import { persistentMap } from '@nanostores/persistent';

interface IAppPreviewStore {
  currentUrl: string;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  zoomLevel: number; // New: 1.0 = 100%, 0.5 = 50%, 2.0 = 200%
  useProxy: boolean; // New: Whether to route iframe through backend proxy
}

export const appPreviewStore = persistentMap<IAppPreviewStore>(
  'appPreview:',
  {
    currentUrl: '',
    screenSize: 'desktop',
    zoomLevel: 1.0, // Default zoom level
    useProxy: false, // Default to not using proxy
  },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);
