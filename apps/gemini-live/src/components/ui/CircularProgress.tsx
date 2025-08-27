import React from 'react';
import MuiCircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

const CircularProgress: React.FC<CircularProgressProps> = (props) => {
  return <MuiCircularProgress {...props} />;
};

export default CircularProgress;
