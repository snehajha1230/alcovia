import React from 'react';
import { G, Path } from 'react-native-svg';
import { LEAF_PATH, type GroveLeaf } from './shrubGeometry';

type Props = {
  leaf: GroveLeaf;
  sessionProgress: number;
};

/**
 * Attaches when session progress crosses height/point.y (reference threshold).
 * Full size instantly — no scale-in animation.
 */
export function ShrubLeaf({ leaf, sessionProgress }: Props) {
  if (sessionProgress < leaf.appearAt) return null;

  return (
    <G
      transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rotation}) scale(${leaf.scaleX}, ${leaf.scaleY}) translate(-5, -2.5)`}
    >
      <Path d={LEAF_PATH} fill={leaf.fill} />
    </G>
  );
}
