import React from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';

interface CustomTextFieldProps extends TextFieldProps {
  // You can add custom props here if needed
}

const TextField: React.FC<CustomTextFieldProps> = (props) => {
  return <MuiTextField {...props} fullWidth margin="normal" />;
};

export default TextField;
