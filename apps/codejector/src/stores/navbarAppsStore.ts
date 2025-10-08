import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { appDefinitions } from '@/constants/appDefinitions';

// Define the default apps that appear in the Navbar if no user-specific selection is made
const DEFAULT_NAVBAR_APP_IDS = [
  'ai-editor',
  'llm-generation',
  'media-player',
  'recording',
];

interface NavbarAppsState {
  appIds: string[];
}

// Initialize the persistent store.
// Default to empty array, logic for default apps is in getNavbarAppDefinitions.
export const $navbarApps = persistentAtom<NavbarAppsState>(
  'navbar-apps-selection',
  { appIds: [] },
  {
    encode: (value) => JSON.stringify(value),
    decode: (value) => {
      try {
        const parsed = JSON.parse(value);
        return { appIds: Array.isArray(parsed.appIds) ? parsed.appIds : [] };
      } catch {
        // If decoding fails, return an empty array, which will trigger the default logic in getNavbarAppDefinitions
        return { appIds: [] };
      }
    },
  },
);

export const addNavbarApp = (appId: string) => {
  const currentAppIds = $navbarApps.get().appIds;
  if (!currentAppIds.includes(appId)) {
    $navbarApps.set({ appIds: [...currentAppIds, appId] });
  }
};

export const removeNavbarApp = (appId: string) => {
  const currentAppIds = $navbarApps.get().appIds;
  $navbarApps.set({ appIds: currentAppIds.filter((id) => id !== appId) });
};

// Helper to get the full list of app definitions currently intended for the navbar
export const getNavbarAppDefinitions = () => {
  const selectedAppIds = $navbarApps.get().appIds;
  // If the user has explicitly selected apps (i.e., the stored array is not empty),
  // use their selection. Otherwise, use the predefined DEFAULT_NAVBAR_APP_IDS.
  const finalAppIds =
    selectedAppIds.length > 0 ? selectedAppIds : DEFAULT_NAVBAR_APP_IDS;
  return appDefinitions.filter((app) => finalAppIds.includes(app.id));
};
