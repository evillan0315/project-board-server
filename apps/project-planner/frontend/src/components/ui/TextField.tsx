import React from 'react';
import { TextField as MuiTextField, TextFieldProps } from '@mui/material';

export const TextField: React.FC<TextFieldProps> = (props) => {
  return <MuiTextField {...props} />;
};
