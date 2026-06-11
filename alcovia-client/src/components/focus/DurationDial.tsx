import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { fonts } from '../../theme/typography';
import { MAX_FOCUS_MINUTES, MIN_FOCUS_MINUTES } from '../../types';

const DIAL_SIZE = 260;
const RING_RADIUS = 98;
const KNOB_RADIUS = 12;

type Props = {
  visible: boolean;
  duration: number;
  onDurationChange: (minutes: number) => void;
  onStart: () => void;
  onClose: () => void;
};

function snapMinutes(value: number) {
  const snapped = Math.round(value / 5) * 5;
  return Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, snapped));
}

function minutesToAngle(minutes: number) {
  const ratio = (minutes - MIN_FOCUS_MINUTES) / (MAX_FOCUS_MINUTES - MIN_FOCUS_MINUTES);
  return ratio * 360 - 90;
}

function angleToMinutes(angleDeg: number) {
  let normalized = (angleDeg + 90) % 360;
  if (normalized < 0) normalized += 360;
  const ratio = normalized / 360;
  return snapMinutes(MIN_FOCUS_MINUTES + ratio * (MAX_FOCUS_MINUTES - MIN_FOCUS_MINUTES));
}

function polarToXY(angleDeg: number, radius: number, center: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

export function DurationDial({ visible, duration, onDurationChange, onStart, onClose }: Props) {
  const center = DIAL_SIZE / 2;
  const dialWrapRef = useRef<ViewType>(null);
  const dialRef = useRef({ x: 0, y: 0, size: DIAL_SIZE });
  const onDurationChangeRef = useRef(onDurationChange);
  const [layoutReady, setLayoutReady] = useState(false);

  onDurationChangeRef.current = onDurationChange;

  const knob = useMemo(() => polarToXY(minutesToAngle(duration), RING_RADIUS, center), [duration, center]);

  const updateFromTouch = (pageX: number, pageY: number) => {
    const { x, y, size } = dialRef.current;
    const localX = pageX - x;
    const localY = pageY - y;
    const cx = size / 2;
    const cy = size / 2;
    const angle = (Math.atan2(localY - cy, localX - cx) * 180) / Math.PI;
    onDurationChangeRef.current(angleToMinutes(angle));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
      onPanResponderMove: (evt) => updateFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY),
    })
  ).current;

  useEffect(() => {
    if (!visible) setLayoutReady(false);
  }, [visible]);

  const measureDial = () => {
    dialWrapRef.current?.measureInWindow((x, y, width) => {
      dialRef.current = { x, y, size: width };
      setLayoutReady(true);
    });
  };

  const ticks = useMemo(() => {
    const marks: number[] = [];
    for (let m = MIN_FOCUS_MINUTES; m <= MAX_FOCUS_MINUTES; m += 15) marks.push(m);
    return marks;
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Set focus duration</Text>
          <Text style={styles.subtitle}>Drag the dial · {MIN_FOCUS_MINUTES}–{MAX_FOCUS_MINUTES} min</Text>

          <View
            ref={dialWrapRef}
            style={styles.dialWrap}
            onLayout={measureDial}
            {...(layoutReady ? panResponder.panHandlers : {})}
          >
            <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
              <Circle cx={center} cy={center} r={RING_RADIUS} stroke="#dbeafe" strokeWidth={16} fill="none" />
              <Circle
                cx={center}
                cy={center}
                r={RING_RADIUS}
                stroke="#2563eb"
                strokeWidth={16}
                fill="none"
                strokeDasharray={`${((duration - MIN_FOCUS_MINUTES) / (MAX_FOCUS_MINUTES - MIN_FOCUS_MINUTES)) * (2 * Math.PI * RING_RADIUS)} ${2 * Math.PI * RING_RADIUS}`}
                rotation={-90}
                origin={`${center}, ${center}`}
              />
              {ticks.map((mark) => {
                const outer = polarToXY(minutesToAngle(mark), RING_RADIUS + 18, center);
                const inner = polarToXY(minutesToAngle(mark), RING_RADIUS + 8, center);
                return (
                  <Line
                    key={mark}
                    x1={inner.x}
                    y1={inner.y}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                );
              })}
              <Circle cx={knob.x} cy={knob.y} r={KNOB_RADIUS} fill="#fff" stroke="#2563eb" strokeWidth={3} />
            </Svg>

            <View style={styles.centerReadout} pointerEvents="none">
              <Text style={styles.minutesValue}>{duration}</Text>
              <Text style={styles.minutesLabel}>minutes</Text>
            </View>
          </View>

          <View style={styles.presetRow}>
            {[25, 45, 60, 90].map((value) => (
              <Pressable
                key={value}
                style={[styles.presetChip, duration === value && styles.presetChipActive]}
                onPress={() => onDurationChange(value)}
              >
                <Text style={[styles.presetText, duration === value && styles.presetTextActive]}>{value}m</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>Start session</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#111827',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#6b7280',
  },
  dialWrap: {
    marginTop: 18,
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerReadout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutesValue: {
    fontFamily: fonts.displayBold,
    fontSize: 44,
    color: '#111827',
    lineHeight: 48,
    letterSpacing: -1,
  },
  minutesLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  presetChipActive: {
    backgroundColor: '#dbeafe',
  },
  presetText: {
    fontFamily: fonts.bodySemiBold,
    color: '#4b5563',
    fontSize: 13,
  },
  presetTextActive: {
    color: '#1d4ed8',
  },
  startButton: {
    marginTop: 16,
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});
