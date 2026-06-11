import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { G, Line } from 'react-native-svg';
import { ShrubLeaf } from './ShrubLeaf';
import { ShrubStem } from './ShrubStem';
import {
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  countVisibleLeaves,
  generateGrove,
  type GroveStem,
} from './shrubGeometry';

type Props = {
  progress: number;
  idle: boolean;
  pulsing?: boolean;
  seed: string;
  onLeafCountChange?: (visible: number, total: number) => void;
};

export function GrowingTree({ progress, idle, pulsing, seed, onLeafCountChange }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const sessionProgress = idle ? 0 : Math.min(1, Math.max(0, progress));
  const active = !idle;

  const plants = useMemo(() => generateGrove(seed, 10, 30), [seed]);

  useEffect(() => {
    if (!onLeafCountChange) return;
    const { visible, total } = countVisibleLeaves(plants, sessionProgress);
    onLeafCountChange(visible, total);
  }, [onLeafCountChange, plants, sessionProgress]);

  useEffect(() => {
    if (!pulsing) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.02,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulsing, pulse]);

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMax meet"
      >
        <Line
          x1={0}
          y1={VIEWBOX_HEIGHT}
          x2={VIEWBOX_WIDTH}
          y2={VIEWBOX_HEIGHT}
          stroke="#b8b0a8"
          strokeWidth={1.5}
          opacity={0.6}
        />

        {active && (
          <>
            <G id="stems" fill="none" stroke="green">
              {plants.map((plant) =>
                plant.stems.map((stem: GroveStem) => <ShrubStem key={stem.id} stem={stem} />)
              )}
            </G>
            <G id="leaves">
              {plants.map((plant) =>
                plant.leaves.map((leaf) => (
                  <ShrubLeaf key={leaf.id} leaf={leaf} sessionProgress={sessionProgress} />
                ))
              )}
            </G>
          </>
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 360,
    height: 280,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
