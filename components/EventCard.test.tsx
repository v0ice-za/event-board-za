import { fireEvent, render, screen } from '@testing-library/react-native';
import { Image } from 'expo-image';

import { CATEGORY_PLACEHOLDERS } from '@/constants/categories';
import type { Event } from '@/types';

import { EventCard } from './EventCard';

const baseEvent: Event = {
  id: 'evt-1',
  name: 'Jazz on the Lake',
  date: '2026-05-30',
  time: '19:00',
  venue: 'Emmarentia Dam',
  address: null,
  category: 'Music',
  description: null,
  price: null,
  ticketLink: null,
  imageUrl: 'https://example.com/jazz.jpg',
  source: 'quicket',
  lastUpdated: '2026-05-01T00:00:00.000Z',
};

describe('EventCard', () => {
  it('renders the name, human-readable date, and venue', () => {
    render(<EventCard event={baseEvent} onPress={() => {}} />);
    expect(screen.queryByText('Jazz on the Lake')).not.toBeNull();
    expect(screen.queryByText('Sat 30 May')).not.toBeNull();
    expect(screen.queryByText(/Emmarentia Dam/)).not.toBeNull();
    // Raw ISO date must never be shown
    expect(screen.queryByText('2026-05-30')).toBeNull();
  });

  it('renders expo-image when an imageUrl is present', () => {
    render(<EventCard event={baseEvent} onPress={() => {}} />);
    expect(screen.UNSAFE_queryByType(Image)).not.toBeNull();
    // CategoryPlaceholder emoji should NOT be shown when a real image renders
    expect(screen.queryByText(CATEGORY_PLACEHOLDERS.Music.emoji)).toBeNull();
  });

  it('falls back to CategoryPlaceholder when imageUrl is null', () => {
    render(<EventCard event={{ ...baseEvent, imageUrl: null }} onPress={() => {}} />);
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    expect(screen.queryByText(CATEGORY_PLACEHOLDERS.Music.emoji)).not.toBeNull();
  });

  it('falls back to CategoryPlaceholder when the image fails to load', () => {
    render(<EventCard event={baseEvent} onPress={() => {}} />);
    fireEvent(screen.UNSAFE_getByType(Image), 'error');
    expect(screen.UNSAFE_queryByType(Image)).toBeNull();
    expect(screen.queryByText(CATEGORY_PLACEHOLDERS.Music.emoji)).not.toBeNull();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<EventCard event={baseEvent} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('sets an accessibility label of "{name}, {date}, {venue}"', () => {
    render(<EventCard event={baseEvent} onPress={() => {}} />);
    expect(
      screen.queryByLabelText('Jazz on the Lake, Sat 30 May, Emmarentia Dam'),
    ).not.toBeNull();
  });
});
