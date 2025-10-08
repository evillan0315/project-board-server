import React from 'react';
import type { SVGProps } from 'react';

export function CodiconLayoutPanelLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.4em"
      height="1.4em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="#00a5be"
        d="m1 2l1-1h12l1 1v12l-1 1H2l-1-1zm1 0v8h8V2zm9 0v12h3V2z"
      ></path>
    </svg>
  );
}

export function CodiconLayoutSidebarLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.4em"
      height="1.4em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="#00a5be"
        fillRule="evenodd"
        d="M2 1L1 2v12l1 1h12l1-1V2l-1-1zm12 13H7V2h7z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}

export function CodiconLayoutSidebarLeftOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.4em"
      height="1.4em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="#00a5be"
        d="M2 1L1 2v12l1 1h12l1-1V2l-1-1zm0 13V2h4v12zm5 0V2h7v12z"
      ></path>
    </svg>
  );
}
