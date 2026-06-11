import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { fonts } from '../theme/typography';
import type { TaskStatus } from '../types';
import { SubjectBook } from './syllabus/SubjectBook';
import { BOOK_PALETTES, TOPIC_STATUS_STYLE } from './syllabus/topicStyles';

const STATUS_HINT: Record<TaskStatus, string> = {
  not_started: 'Tap to start',
  in_progress: 'In progress',
  done: 'Done',
};

const BOOKS_PER_ROW = 3;
const BOOK_GAP = 12;

export function SyllabusTab() {
  const { state, updateTaskStatus, deleteTask, getChapterProgress, getSubjectProgress } = useApp();
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  useEffect(() => {
    if (state.subjects.length === 0) {
      setSelectedSubjectId(null);
      return;
    }
    if (!selectedSubjectId || !state.subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(state.subjects[0].id);
    }
  }, [state.subjects, selectedSubjectId]);

  const selectedSubject = useMemo(
    () => state.subjects.find((s) => s.id === selectedSubjectId) ?? null,
    [state.subjects, selectedSubjectId]
  );

  const chaptersForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return state.chapters.filter((chapter) => chapter.subjectId === selectedSubject.id);
  }, [state.chapters, selectedSubject]);

  const shelfWidth = isWide ? 390 : Math.min(width - 40, 390);
  const bookWidth = (shelfWidth - BOOK_GAP * (BOOKS_PER_ROW - 1)) / BOOKS_PER_ROW;

  if (state.subjects.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>Syllabus will load after first sync. Toggle online and tap Sync.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.layout, isWide ? styles.layoutWide : styles.layoutNarrow]}>
      <View style={[styles.shelfPanel, { width: shelfWidth }, isWide && styles.shelfPanelWide]}>
        <Text style={styles.shelfHeading}>Subjects</Text>
        <ScrollView
          style={styles.shelfScroll}
          contentContainerStyle={styles.shelf}
          showsVerticalScrollIndicator={false}
        >
          {state.subjects.map((subject, index) => (
            <SubjectBook
              key={subject.id}
              name={subject.name}
              progress={getSubjectProgress(subject.id)}
              palette={BOOK_PALETTES[index % BOOK_PALETTES.length]}
              selected={subject.id === selectedSubjectId}
              width={bookWidth}
              onPress={() => setSelectedSubjectId(subject.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.topicsPanel, isWide && styles.topicsPanelWide]}>
        {!selectedSubject ? (
          <View style={styles.topicsPlaceholder}>
            <Text style={styles.placeholderTitle}>Pick a book</Text>
            <Text style={styles.placeholderText}>Select a subject to view its topics.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.topicsScroll}
            contentContainerStyle={styles.topicsScrollInner}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topicsHeader}>
              <Text style={styles.topicsTitle}>{selectedSubject.name}</Text>
              <Text style={styles.topicsMeta}>
                {getSubjectProgress(selectedSubject.id)}% complete · {chaptersForSubject.length} chapters
              </Text>
            </View>

            {chaptersForSubject.map((chapter) => {
              const chapterTasks = state.tasks.filter((task) => task.chapterId === chapter.id);
              if (chapterTasks.length === 0) return null;

              return (
                <View key={chapter.id} style={styles.chapterBlock}>
                  <View style={styles.chapterHeader}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterProgress}>{getChapterProgress(chapter.id)}%</Text>
                  </View>

                  {chapterTasks.map((task) => {
                    const colors = TOPIC_STATUS_STYLE[task.status];
                    return (
                      <View key={task.id} style={styles.topicRow}>
                        <Pressable
                          style={[
                            styles.topicCard,
                            {
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                            },
                          ]}
                          onPress={() => updateTaskStatus(task.id)}
                        >
                          <View style={[styles.statusDot, { backgroundColor: colors.dot }]} />
                          <View style={styles.topicTextBlock}>
                            <Text style={[styles.topicTitle, { color: colors.text }]}>{task.title}</Text>
                            <Text style={[styles.topicHint, { color: colors.text }]}>{STATUS_HINT[task.status]}</Text>
                          </View>
                        </Pressable>
                        <Pressable style={styles.deleteButton} onPress={() => deleteTask(task.id)}>
                          <Text style={styles.deleteText}>×</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    minHeight: 560,
  },
  layoutWide: {
    flexDirection: 'row',
    gap: 20,
  },
  layoutNarrow: {
    flexDirection: 'column',
    gap: 16,
  },
  shelfPanel: {
    gap: 10,
    minHeight: 400,
    maxHeight: 520,
  },
  shelfPanelWide: {
    flexShrink: 0,
    flex: 1,
    minHeight: 520,
    maxHeight: undefined,
  },
  shelfScroll: {
    flex: 1,
  },
  shelfHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shelf: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: BOOK_GAP,
    rowGap: 4,
  },
  topicsPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 280,
    overflow: 'hidden',
  },
  topicsPanelWide: {
    minHeight: 480,
  },
  topicsScroll: {
    flex: 1,
  },
  topicsScrollInner: {
    padding: 18,
    paddingBottom: 28,
    gap: 16,
  },
  topicsHeader: {
    gap: 4,
    marginBottom: 4,
  },
  topicsTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: '#111827',
    letterSpacing: -0.3,
  },
  topicsMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#6b7280',
  },
  topicsPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
  },
  placeholderTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: '#374151',
  },
  placeholderText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  chapterBlock: {
    gap: 8,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  chapterTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#374151',
  },
  chapterProgress: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#6b7280',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  topicCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topicTextBlock: {
    flex: 1,
    gap: 2,
  },
  topicTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  topicHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    opacity: 0.85,
  },
  deleteButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteText: {
    color: '#b91c1c',
    fontSize: 18,
    lineHeight: 20,
    fontFamily: fonts.bodyBold,
  },
  emptyWrap: {
    padding: 12,
  },
  empty: {
    color: '#6b7280',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
