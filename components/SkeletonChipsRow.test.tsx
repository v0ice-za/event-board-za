import { render, screen } from '@testing-library/react-native';

import { SkeletonChipsRow } from './SkeletonChipsRow';

describe('SkeletonChipsRow', () => {
  it('renders a loading-labelled shimmer row', () => {
    render(<SkeletonChipsRow />);
    expect(screen.queryByLabelText('Loading filters')).not.toBeNull();
  });

  it('renders one shimmer pill per configured width', () => {
    render(<SkeletonChipsRow />);
    // Assert on rendered output (testID), not the element's `children` prop, so the test
    // survives container/structure refactors. PILL_WIDTHS has 5 entries.
    expect(screen.getAllByTestId('skeleton-chip-pill')).toHaveLength(5);
  });
});
