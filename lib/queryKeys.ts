import type { Category } from '@/types';

export const eventKeys = {
  all: ['events'] as const,
  list: (category: Category | null) =>
    [...eventKeys.all, 'list', category] as const,
  detail: (id: string) =>
    [...eventKeys.all, 'detail', id] as const,
};
