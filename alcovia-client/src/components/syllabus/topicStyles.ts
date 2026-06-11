import type { TaskStatus } from '../../types';

export const TOPIC_STATUS_STYLE: Record<
  TaskStatus,
  { background: string; text: string; border: string; dot: string }
> = {
  not_started: {
    background: '#f3f4f6',
    text: '#6b7280',
    border: '#e5e7eb',
    dot: '#9ca3af',
  },
  in_progress: {
    background: '#dbeafe',
    text: '#1d4ed8',
    border: '#93c5fd',
    dot: '#2563eb',
  },
  done: {
    background: '#dcfce7',
    text: '#15803d',
    border: '#86efac',
    dot: '#16a34a',
  },
};

export const BOOK_PALETTES = [
  { cover: '#5b4bb7', spine: '#4338a5', pages: '#ede9fe', label: '#f5f3ff' },
  { cover: '#0f766e', spine: '#115e59', pages: '#ccfbf1', label: '#f0fdfa' },
  { cover: '#b45309', spine: '#92400e', pages: '#ffedd5', label: '#fff7ed' },
  { cover: '#be185d', spine: '#9d174d', pages: '#fce7f3', label: '#fdf2f8' },
  { cover: '#1d4ed8', spine: '#1e40af', pages: '#dbeafe', label: '#eff6ff' },
  { cover: '#047857', spine: '#065f46', pages: '#d1fae5', label: '#ecfdf5' },
  { cover: '#7c2d12', spine: '#6c2710', pages: '#ffedd5', label: '#fff7ed' },
  { cover: '#6d28d9', spine: '#5b21b6', pages: '#ede9fe', label: '#f5f3ff' },
  { cover: '#15803d', spine: '#166534', pages: '#dcfce7', label: '#f0fdf4' },
  { cover: '#c2410c', spine: '#9a3412', pages: '#ffedd5', label: '#fff7ed' },
  { cover: '#0369a1', spine: '#075985', pages: '#e0f2fe', label: '#f0f9ff' },
  { cover: '#a21caf', spine: '#86198f', pages: '#fae8ff', label: '#fdf4ff' },
];
