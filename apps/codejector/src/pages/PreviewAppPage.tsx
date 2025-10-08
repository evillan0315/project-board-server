import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import BrowserAppToolbar from '@/components/preview/BrowserAppToolbar';
import AppPreviewContent from '@/components/preview/AppPreviewContent';
import { useStore } from '@nanostores/react';
import { appPreviewStore } from '@/stores/appPreviewStore';
import PageLayout from '@/components/layouts/PageLayout'; // Import PageLayout

const PreviewAppPage: React.FC = () => {
  const { currentUrl, screenSize } = useStore(appPreviewStore);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize currentUrl in the store if it's empty, using the environment variable
  useEffect(() => {
    if (!currentUrl && import.meta.env.VITE_PREVIEW_APP_URL) {
      appPreviewStore.setKey(
        'currentUrl',
        import.meta.env.VITE_PREVIEW_APP_URL,
      );
    }
  }, [currentUrl]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.location.reload();
    }
  };

  const handleGoBack = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.history.back();
    }
  };

  const handleResetToDefault = () => {
    appPreviewStore.setKey(
      'currentUrl',
      import.meta.env.VITE_PREVIEW_APP_URL || '',
    );
  };

  // Content for the header slot of PageLayout
  const headerContent = (
    // Wrap BrowserAppToolbar in a Box to center it horizontally within the AppBar's Toolbar
    <Box className="flex w-full justify-center">
      <BrowserAppToolbar onRefresh={handleRefresh} onGoBack={handleGoBack} />
    </Box>
  );

  // Content for the body slot of PageLayout
  const bodyContent = (
    // AppPreviewContent should be allowed to size itself based on screenSize prop
    // This wrapper Box will ensure AppPreviewContent is horizontally centered and takes up vertical space.
    <Box className="w-full h-full flex justify-center items-start overflow-auto">
      <AppPreviewContent
        currentUrl={currentUrl}
        screenSize={screenSize}
        iframeRef={iframeRef}
      />
    </Box>
  );

  return (
    <PageLayout
      header={headerContent}
      body={bodyContent}
      centerBodyContent={false} // The inner Box handles centering, so PageLayout should not force it.
      bodyPosition="top" // Ensure PageLayout aligns its body content to the top.
    />
  );
};

export default PreviewAppPage;
