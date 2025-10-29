import React from 'react';
import { Button as MuiButton, ButtonProps } from '@mui/material';

/**
 * @interface CustomButtonProps
 * @extends ButtonProps
 * @description Props for the custom Button component.
 */
interface CustomButtonProps extends ButtonProps {
  // Add any custom props here if needed
}

/**
 * @component Button
 * @description A custom wrapper component for Material UI's Button.
 *              It conditionally wraps disabled buttons in a `<span>` element.
 *              This addresses the MUI Tooltip warning where a Tooltip cannot display
 *              over a disabled button because disabled elements don't fire events.
 *              The `Tooltip` should then wrap this `<span>` element if the button is disabled.
 */
const Button: React.FC<CustomButtonProps> = ({ disabled, children, ...props }) => {
  const buttonContent = (
    <MuiButton disabled={disabled} {...props}>
      {children}
    </MuiButton>
  );

  // If the button is disabled, wrap it in a span.
  // This allows external Tooltip components to attach to the non-disabled span
  // and still display their title, while the button itself remains disabled.
  if (disabled) {
    return (
      <span
        style={{
          display: 'inline-block', // Important for span to wrap the button correctly
          cursor: 'not-allowed', // Visual indication of disablement
        }}
      >
        {buttonContent}
      </span>
    );
  }

  return buttonContent;
};

export default Button;
