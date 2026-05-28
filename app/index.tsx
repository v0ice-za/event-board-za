import { View, Text } from 'react-native';

// Verification view for Story 1.2: confirms NativeWind Dark Warm tokens render correctly.
// bg-background (#0F0C09) + text-text-primary (#F5F0E8) should be visible on device.
// This screen is fully replaced in Story 2.6.
export default function FeedScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="font-inter-bold text-text-primary text-lg">Event Board ZA</Text>
      <Text className="font-inter text-text-secondary text-sm mt-2">NativeWind ✓</Text>
    </View>
  );
}
