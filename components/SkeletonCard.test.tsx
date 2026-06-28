import { render, screen } from '@testing-library/react-native';

import { SkeletonCard } from './SkeletonCard';

describe('SkeletonCard', () => {
  it('renders with the "Loading events" accessibility label', () => {
    render(<SkeletonCard />);
    expect(screen.queryByLabelText('Loading events')).not.toBeNull();
  });

  it('marks the decorative shimmer as non-accessible (AC #9)', () => {
    render(<SkeletonCard />);
    expect(screen.UNSAFE_getByProps({ importantForAccessibility: 'no' })).toBeTruthy();
  });
});
