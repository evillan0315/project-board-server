import React from 'react';
import MuiButton, { ButtonProps } from '@mui/material/Button';

interface CustomButtonProps extends ButtonProps {
  // You can add custom props here if needed
}

const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  return (
    <MuiButton {...props} className={`!normal-case ${props.className || ''}`}>
      {children}
    </MuiButton>
  );
};

export default Button;
