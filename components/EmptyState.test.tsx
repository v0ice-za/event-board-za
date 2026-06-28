import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

// Mock @expo/vector-icons — Feather glyph loads its font asynchronously,
// firing a post-render setState (act warning) and is irrelevant to these assertions.
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

// Mock CATEGORY_PLACEHOLDERS to validate fallback behavior on schema mismatch.
jest.mock('@/constants/categories', () => ({
  CATEGORY_PLACEHOLDERS: {
    Music: { emoji: '🎵', label: 'Music' },
    Sport: { emoji: '⚽', label: 'Sport' },
  },
  FALLBACK_PLACEHOLDER: { emoji: '📌', label: 'Event' },
}));

describe('EmptyState', () => {
  it('renders empty-category content with the category interpolated', () => {
    render(<EmptyState variant="empty-category" category="Music" onAction={() => {}} />);
    expect(screen.queryByText('No Music events right now')).not.toBeNull();
    expect(screen.queryByText('Try a different category or check back later')).not.toBeNull();
    expect(screen.queryByText('Clear filter')).not.toBeNull();
  });

  it('falls back to a generic heading when category is null', () => {
    render(<EmptyState variant="empty-category" category={null} onAction={() => {}} />);
    expect(screen.queryByText('No events right now')).not.toBeNull();
    expect(screen.queryByText('Clear filter')).not.toBeNull();
  });

  it('renders no-connection content with a Retry pill', () => {
    render(<EmptyState variant="no-connection" onAction={() => {}} />);
    expect(screen.queryByText('No connection')).not.toBeNull();
    expect(screen.queryByText('Check your signal and try again')).not.toBeNull();
    expect(screen.queryByText('Retry')).not.toBeNull();
  });

  it('renders general-error content with a Retry pill', () => {
    render(<EmptyState variant="general-error" onAction={() => {}} />);
    expect(screen.queryByText('Something went wrong')).not.toBeNull();
    expect(screen.queryByText('Try again or check back later')).not.toBeNull();
    expect(screen.queryByText('Retry')).not.toBeNull();
  });

  it('calls onAction when the recovery pill is pressed', () => {
    const onAction = jest.fn();
    render(<EmptyState variant="no-connection" onAction={onAction} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('exposes the pill with an accessible button role and label', () => {
    render(<EmptyState variant="empty-category" category="Sport" onAction={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).not.toBeNull();
    expect(button.props.accessibilityLabel).toBe('Clear filter');
  });

  it('handles invalid variant gracefully and logs warning', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<EmptyState variant={'invalid-variant' as any} onAction={() => {}} />);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid variant'));
    consoleWarnSpy.mockRestore();
  });

  it('handles missing onAction gracefully', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<EmptyState variant="no-connection" onAction={undefined as any} />);
    fireEvent.press(screen.getByRole('button'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('onAction is not a function'));
    consoleWarnSpy.mockRestore();
  });

  it('handles onAction throwing an error gracefully', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const throwingAction = jest.fn(() => {
      throw new Error('Test error');
    });
    render(<EmptyState variant="general-error" onAction={throwingAction} />);
    fireEvent.press(screen.getByRole('button'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('onAction error'), expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
