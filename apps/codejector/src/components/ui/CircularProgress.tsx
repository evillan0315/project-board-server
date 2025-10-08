import React from 'react';
import MuiCircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';

const CircularProgress: React.FC<CircularProgressProps> = (props) => (
  <MuiCircularProgress {...props} />
);

export default CircularProgress;
