import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';

interface FloatingSettingsProps {
  initialPosition?: { x: number; y: number };
  onClose: () => void;
}

const FloatingSettings: React.FC<FloatingSettingsProps> = ({
  initialPosition,
  onClose,
}) => {
  const [position, setPosition] = useState(
    initialPosition || { x: 0, y: window.innerHeight - 100 },
  );
  const [size, setSize] = useState({ width: 300, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialPosition) {
      setPosition({ x: 0, y: window.innerHeight - size.height });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startSize.current = size;
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.stopPropagation();
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (isResizing) {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      setSize({
        width: Math.max(100, startSize.current.width + deltaX),
        height: Math.max(50, startSize.current.height + deltaY),
      });
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isDragging, isResizing]);

  const wrapperStyle = {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    width: size.width,
    height: size.height,
    minWidth: '100px',
    minHeight: '50px',
    zIndex: 1200,
    overflow: 'hidden', // Clip content to rounded borders
  };

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div ref={wrapperRef} style={wrapperStyle} className="select-none">
      <Paper
        elevation={4}
        className="flex flex-col h-full rounded-md overflow-hidden"
        onMouseDown={handleStopPropagation}
        onMouseUp={handleStopPropagation}
      >
        <div
          className="flex items-center justify-between bg-gray-100 p-2 cursor-move"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <Typography variant="subtitle2" className="font-semibold">
            Settings
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        <div className="flex-grow overflow-auto p-4">
          <Typography>Config Settings</Typography>
        </div>
        <div
          className="absolute bottom-0 right-0 cursor-nw-resize h-6 w-6 bg-blue-300 rounded-tl-sm hover:bg-blue-400"
          onMouseDown={handleResizeMouseDown}
          style={{ cursor: isResizing ? 'nw-resize' : 'nw-resize' }}
        />
      </Paper>
    </div>
  );
};

export default FloatingSettings;
