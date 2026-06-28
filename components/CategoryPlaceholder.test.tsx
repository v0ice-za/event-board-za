import { render, screen } from '@testing-library/react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CATEGORY_PLACEHOLDERS, CATEGORY_VALUES, FALLBACK_PLACEHOLDER } from '@/constants/categories';
import type { Category } from '@/types';

import { CategoryPlaceholder } from './CategoryPlaceholder';

describe('CategoryPlaceholder', () => {
  it('renders the category emoji', () => {
    render(<CategoryPlaceholder category="Music" />);
    expect(screen.queryByText(CATEGORY_PLACEHOLDERS.Music.emoji)).not.toBeNull();
  });

  it('passes the category gradient colours to LinearGradient', () => {
    render(<CategoryPlaceholder category="Sport" />);
    const gradient = screen.UNSAFE_getByType(LinearGradient);
    expect(gradient.props.colors).toEqual(CATEGORY_PLACEHOLDERS.Sport.colors);
  });

  it('is decorative — root is marked non-accessible', () => {
    render(<CategoryPlaceholder category="Nightlife" />);
    const gradient = screen.UNSAFE_getByType(LinearGradient);
    expect(gradient.props.accessible).toBe(false);
  });

  it('renders every category variant without crashing', () => {
    for (const category of CATEGORY_VALUES) {
      const view = render(<CategoryPlaceholder category={category} />);
      expect(screen.queryByText(CATEGORY_PLACEHOLDERS[category].emoji)).not.toBeNull();
      view.unmount();
    }
  });

  it('falls back to the neutral placeholder for an unmapped category', () => {
    // Event data comes from external feeds; an unknown category must not crash the card.
    render(<CategoryPlaceholder category={'Unknown' as Category} />);
    const gradient = screen.UNSAFE_getByType(LinearGradient);
    expect(gradient.props.colors).toEqual(FALLBACK_PLACEHOLDER.colors);
    expect(screen.queryByText(FALLBACK_PLACEHOLDER.emoji)).not.toBeNull();
  });
});
