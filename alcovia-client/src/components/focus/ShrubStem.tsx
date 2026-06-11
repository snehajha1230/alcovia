import React from 'react';
import { Path } from 'react-native-svg';
import type { GroveStem } from './shrubGeometry';

type Props = {
  stem: GroveStem;
};

/** Full empty stem visible when session starts (reference stroke style). */
export function ShrubStem({ stem }: Props) {
  return (
    <Path
      d={stem.path}
      fill="none"
      stroke="green"
      strokeWidth={stem.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.45}
    />
  );
}
