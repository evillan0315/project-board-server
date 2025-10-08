// src/components/RemoteSvg.tsx
import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import type { IconifyIconPrefix } from '@iconify/types';
import { errorStore, setError } from '@/stores/errorStore';

export interface NamePrefixSvgIconProps {
  prefix: IconifyIconPrefix;
  name: string; // icon name inside the prefix
  size?: number | string; // e.g. 48 or '2rem'
  alt?: string;
  fallback?: string; // optional fallback icon name
}

export function NamePrefixSvgIcon({
  prefix = 'material-icon-theme',
  name,
  size = 48,
  alt = `${prefix}:${name} icon`,
  fallback = 'document', // supply a known fallback in your API
}: NamePrefixSvgIconProps) {
  const error = useStore(errorStore);
  // pick the current name; if the first request errors, use the fallback
  const iconName = error ? fallback : name;
  const src = `http://localhost:3001/api/icon/${prefix}/${iconName}`;

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: size, height: size }}
      onError={() => setError('Icon does not exists in the api')}
    />
  );
}
