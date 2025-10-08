import React from 'react';
import type { SVGProps } from 'react';

export function CarbonTerminal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.4em"
      height="1.4em"
      viewBox="0 0 32 32"
      {...props}
    >
      <path
        fill="#00525f"
        d="M26 4.01H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-20a2 2 0 0 0-2-2m0 2v4H6v-4Zm-20 20v-14h20v14Z"
      ></path>
      <path
        fill="#00525f"
        d="m10.76 16.18l2.82 2.83l-2.82 2.83l1.41 1.41l4.24-4.24l-4.24-4.24z"
      ></path>
    </svg>
  );
}
