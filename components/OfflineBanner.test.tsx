import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('renders the offline copy', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText('No connection — showing saved events')).not.toBeNull();
  });

  it('exposes an alert role so it is announced to screen readers', () => {
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).not.toBeNull();
  });
});
