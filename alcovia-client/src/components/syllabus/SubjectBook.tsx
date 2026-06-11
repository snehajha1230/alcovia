import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../../theme/typography';

export type BookPalette = {
  cover: string;
  spine: string;
  pages: string;
  label: string;
};

type Props = {
  name: string;
  progress: number;
  palette: BookPalette;
  selected: boolean;
  width: number;
  onPress: () => void;
};

export function SubjectBook({ name, progress, palette, selected, width, onPress }: Props) {
  return (
    <Pressable style={[styles.wrapper, { width }]} onPress={onPress}>
      <View style={[styles.book, selected && styles.bookSelected]}>
        <View style={[styles.spine, { backgroundColor: palette.spine }]} />
        <View style={[styles.cover, { backgroundColor: palette.cover }]}>
          <View style={[styles.pageEdge, { backgroundColor: palette.pages }]} />
          <Text style={[styles.coverTitle, { color: palette.label }]} numberOfLines={3}>
            {name}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: palette.label }]} />
          </View>
          <Text style={[styles.progressText, { color: palette.label }]}>{progress}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  book: {
    flexDirection: 'row',
    height: 168,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  bookSelected: {
    opacity: 0.52,
  },
  spine: {
    width: 14,
  },
  cover: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  pageEdge: {
    position: 'absolute',
    right: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.85,
  },
  coverTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
    paddingRight: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#ffffff44',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    opacity: 0.9,
  },
  progressText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.9,
  },
});
