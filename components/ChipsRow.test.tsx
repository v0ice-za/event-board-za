import { fireEvent, render, screen, within } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

import { CATEGORY_VALUES } from '@/constants/categories';

import { ChipsRow } from './ChipsRow';

// ChipsRow uses useFocusEffect, which needs a navigation container at runtime.
// Mock it to invoke the focus callback once so the focus-pulse path is exercised.
jest.mock('expo-router', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}));

describe('ChipsRow', () => {
  it('renders the "All" chip and all 8 category chips', () => {
    render(<ChipsRow activeCategory={null} onSelect={() => {}} />);
    expect(screen.queryByText('All')).not.toBeNull();
    for (const category of CATEGORY_VALUES) {
      expect(screen.queryByText(category)).not.toBeNull();
    }
  });

  it('calls onSelect(null) when "All" is tapped', () => {
    const onSelect = jest.fn();
    render(<ChipsRow activeCategory="Music" onSelect={onSelect} />);
    fireEvent.press(screen.getByText('All'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect(category) when a category chip is tapped', () => {
    const onSelect = jest.fn();
    render(<ChipsRow activeCategory={null} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Sport'));
    expect(onSelect).toHaveBeenCalledWith('Sport');
  });

  it('marks exactly the active category chip as selected', () => {
    render(<ChipsRow activeCategory="Comedy" onSelect={() => {}} />);
    const selected = screen.getAllByRole('button', { selected: true });
    expect(selected).toHaveLength(1);
    expect(within(selected[0]).queryByText('Comedy')).not.toBeNull();
  });

  it('marks "All" as selected when no category is active', () => {
    render(<ChipsRow activeCategory={null} onSelect={() => {}} />);
    const selected = screen.getAllByRole('button', { selected: true });
    expect(selected).toHaveLength(1);
    expect(within(selected[0]).queryByText('All')).not.toBeNull();
  });

  // Walk up from a node to the first ancestor carrying a pulse `transform` style
  // (the Animated.View that CategoryChip wraps the Pressable in when given a pulseValue).
  const hasPulseTransform = (node: ReactTestInstance | null): boolean => {
    let current = node;
    while (current) {
      const { style } = current.props as { style?: { transform?: unknown } };
      if (style && !Array.isArray(style) && style.transform) return true;
      current = current.parent;
    }
    return false;
  };

  it('passes the pulse transform to the active category chip only', () => {
    render(<ChipsRow activeCategory="Comedy" onSelect={() => {}} />);
    // Active category chip receives the pulseValue → its Animated.View has a transform.
    expect(hasPulseTransform(screen.getByText('Comedy'))).toBe(true);
    // An inactive chip is rendered without a pulse transform.
    expect(hasPulseTransform(screen.getByText('Music'))).toBe(false);
  });

  it('does not pulse any chip when the "All" filter is active', () => {
    render(<ChipsRow activeCategory={null} onSelect={() => {}} />);
    expect(hasPulseTransform(screen.getByText('All'))).toBe(false);
  });
});
