import React from 'react';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';

const TextField: React.FC<TextFieldProps> = (props) => {
  const theme = useTheme();

  return (
    <MuiTextField
      {...props}
      fullWidth
      margin={props.margin || 'normal'} // Allow overriding default margin
      InputLabelProps={{
        ...props.InputLabelProps, // Spread any existing InputLabelProps first
        style: {
          // Then, define/override the style object, merging parent's styles
          color: theme.palette.text.secondary,
          ...(props.InputLabelProps?.style || {}), // Merge parent's inline styles into *this* style object
        },
      }}
      InputProps={{
        ...props.InputProps, // Spread any existing InputProps first
        style: {
          // Then, define/override the style object, merging parent's styles
          color: theme.palette.text.primary,
          ...(props.InputProps?.style || {}), // Merge parent's inline styles into *this* style object
        },
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
          },
        },
        ...props.sx,
      }}
    />
  );
};

export default TextField;
