import { fireEvent, render, screen } from '@testing-library/react-native';

import { CategoryChip } from './CategoryChip';

describe('CategoryChip', () => {
  it('renders the label', () => {
    render(<CategoryChip label="Music" isActive={false} onPress={() => {}} />);
    expect(screen.queryByText('Music')).not.toBeNull();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<CategoryChip label="Music" isActive={false} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('marks accessibilityState.selected when active', () => {
    render(<CategoryChip label="Music" isActive onPress={() => {}} />);
    expect(screen.getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });

  it('does not mark selected when inactive', () => {
    render(<CategoryChip label="Music" isActive={false} onPress={() => {}} />);
    expect(screen.getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('applies accent background when active', () => {
    render(<CategoryChip label="Music" isActive onPress={() => {}} />);
    expect(screen.getByRole('button').props.className).toContain('bg-accent');
  });

  it('applies surface background and a border when inactive', () => {
    render(<CategoryChip label="Music" isActive={false} onPress={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.props.className).toContain('bg-surface');
    expect(button.props.className).toContain('border-border');
  });
});
