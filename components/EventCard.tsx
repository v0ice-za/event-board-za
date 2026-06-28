import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';
import { formatEventDate } from '@/lib/formatDate';
import type { Event } from '@/types';

type EventCardProps = {
  event: Event;
  onPress: () => void;
};

/**
 * Core feed unit: full-bleed image (or CategoryPlaceholder fallback) with a bottom
 * gradient overlay carrying the event name + human-readable date · venue. Navigation
 * is callback-only — the feed screen owns router.push via the onPress prop.
 */
export function EventCard({ event, onPress }: EventCardProps) {
  const [imageError, setImageError] = useState(false);

  // Reset the error flag when the image source changes (in-place refetch / list recycling).
  // React's "adjust state during render" pattern — preferred over a setState-in-effect.
  const [trackedUrl, setTrackedUrl] = useState(event.imageUrl);
  if (trackedUrl !== event.imageUrl) {
    setTrackedUrl(event.imageUrl);
    setImageError(false);
  }

  const formattedDate = formatEventDate(event.date);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${formattedDate}, ${event.venue}`}
      // Pressed scale is a state-driven transform — the documented dynamic-style
      // exception (cannot be a static className). No opacity change (avoids image flicker).
      style={({ pressed }) => (pressed ? { transform: [{ scale: 0.93 }] } : undefined)}
      className="h-[200px] w-full overflow-hidden"
    >
      {event.imageUrl && !imageError ? (
        <Image
          source={{ uri: event.imageUrl }}
          contentFit="cover"
          onError={() => setImageError(true)}
          className="absolute inset-0"
        />
      ) : (
        <CategoryPlaceholder category={event.category} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(15,12,9,0.95)']}
        // Explicit top→bottom so the opaque stop is pinned to the bottom (legible text overlay).
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        accessible={false}
        className="absolute inset-0"
      />

      <View className="absolute bottom-0 left-0 right-0 p-4">
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          className="text-[18px] font-inter-bold text-text-primary"
        >
          {event.name}
        </Text>
        <Text numberOfLines={1} className="text-[13px] text-text-primary">
          <Text className="font-inter-medium">{formattedDate}</Text>
          <Text className="font-inter"> · {event.venue}</Text>
        </Text>
      </View>
    </Pressable>
  );
}
