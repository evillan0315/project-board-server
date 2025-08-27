import React from 'react';
import MuiButton, { ButtonProps } from '@mui/material/Button';

interface CustomButtonProps extends ButtonProps {
  // You can add custom props here if needed
}

const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  return (
    // Removed !normal-case Tailwind class. MUI's theme will handle text transform if specified in components.
    // Using MuiButton defaultProps for disableElevation and textTransform, which are set in theme/index.ts.
    <MuiButton {...props}>{children}</MuiButton>
  );
};

export default Button;
