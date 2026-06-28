import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { CategoryPlaceholder } from '@/components/CategoryPlaceholder';
import { EmptyState } from '@/components/EmptyState';
import { WebViewModal } from '@/components/WebViewModal';
import { COLORS } from '@/constants/theme';
import { useEventDetail } from '@/hooks/useEventDetail';
import { logScreenView, logTicketLinkTapped } from '@/lib/analytics';
import { formatEventDate } from '@/lib/formatDate';
import { useRecordDetailView } from '@/lib/interstitial';
import { eventKeys } from '@/lib/queryKeys';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, isLoading, isError } = useEventDetail(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showTickets, setShowTickets] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Hosted privacy-policy URL from app.config.ts extra (Story 5.4). Empty until the policy
  // is hosted — when empty the footer link is not rendered (no dead link).
  const privacyPolicyUrl =
    (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ?? '';

  // Register this detail view toward the interstitial cadence (SDK-free; logic lives in
  // app/_layout.tsx). recordDetailView is stable (useCallback), so this fires once on mount.
  const recordDetailView = useRecordDetailView();
  useEffect(() => {
    recordDetailView();
  }, [recordDetailView]);

  // Analytics: log the detail screen view once on mount. Above the early returns below so
  // it is rules-of-hooks safe.
  useEffect(() => {
    logScreenView('EventDetail');
  }, []);

  // Mirror EventCard: reset imageError when the image source changes (adjust-state-during-render).
  const [trackedUrl, setTrackedUrl] = useState(event?.imageUrl ?? null);
  if (event && trackedUrl !== event.imageUrl) {
    setTrackedUrl(event.imageUrl);
    setImageError(false);
  }

  // Shared back pill used in both the error and loaded branches to avoid divergence.
  const backPill = (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Back"
      // top/left depend on runtime inset values — documented dynamic-style exception.
      style={{ top: insets.top + 8, left: 16 }}
      className="absolute z-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-background/60"
    >
      <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
    </Pressable>
  );

  if (isLoading) {
    return (
      // paddingTop is a runtime safe-area value — documented dynamic-style exception.
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top }}
        accessibilityLabel="Loading event"
      >
        <StatusBar style="light" />
        <View className="h-[220px] w-full bg-surface" />
        <View className="px-4 pt-4 gap-3">
          <View className="h-4 w-24 rounded bg-surface" />
          <View className="h-6 w-3/4 rounded bg-surface" />
          <View className="h-4 w-1/2 rounded bg-surface" />
        </View>
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View className="flex-1 bg-background">
        <StatusBar style="light" />
        {backPill}
        <View className="flex-1 items-center justify-center">
          <EmptyState
            variant="general-error"
            onAction={() => queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) })}
          />
        </View>
      </View>
    );
  }

  const dateStr = formatEventDate(event.date);
  const dateTimeLine = event.time ? `${dateStr} · ${event.time}` : dateStr;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // Bottom padding so the sticky CTA never overlaps the last content row.
        contentContainerStyle={{ paddingBottom: insets.bottom + 72 }}
      >
        {/* Hero — 220px, full-width */}
        <View className="h-[220px] w-full overflow-hidden">
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
        </View>

        {/* Body */}
        <View className="px-4 pt-4 pb-2 gap-2">
          {/* Category tag */}
          <Text className="text-[13px] font-inter-medium text-accent">{event.category}</Text>

          {/* Event name */}
          <Text className="text-[18px] font-inter-bold text-text-primary">{event.name}</Text>

          {/* Metadata block */}
          <View className="gap-1 mt-1">
            <Text className="text-[14px] font-inter text-text-secondary">{dateTimeLine}</Text>
            <Text className="text-[14px] font-inter text-text-secondary">{event.venue}</Text>
            {event.address && (
              <Text className="text-[14px] font-inter text-text-secondary">{event.address}</Text>
            )}
            {event.price && (
              <Text className="text-[14px] font-inter-medium text-text-primary">{event.price}</Text>
            )}
          </View>

          {/* Description — omitted when null */}
          {event.description && (
            <Text className="mt-2 text-[15px] font-inter text-text-secondary leading-6">
              {event.description}
            </Text>
          )}

          {/* Privacy Policy link — footer of the scrollable body (AC #5). 11px, secondary;
              hidden when no hosted URL is configured. ≥44px touch target via min-h, not font. */}
          {privacyPolicyUrl !== '' && (
            <Pressable
              onPress={() => setShowPrivacy(true)}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
              className="mt-4 min-h-[44px] justify-center"
            >
              <Text className="text-[11px] font-inter text-text-secondary">Privacy Policy</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Back pill — fixed overlay, above the ScrollView, always reachable */}
      {backPill}

      {/* Sticky bottom CTA area — retained whether or not ticketLink is present */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 bg-background"
        // paddingBottom is a runtime safe-area value — documented dynamic-style exception.
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        {event.ticketLink ? (
          <Pressable
            onPress={() => {
              logTicketLinkTapped(event.id);
              setShowTickets(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Get tickets for ${event.name}`}
            className="h-12 w-full items-center justify-center rounded-lg bg-accent"
          >
            <Text className="text-[16px] font-inter-semibold text-text-primary">Get tickets</Text>
          </Pressable>
        ) : (
          <View className="h-12 w-full items-center justify-center">
            <Text className="text-[13px] font-inter text-text-secondary">No tickets required</Text>
          </View>
        )}
      </View>

      {/* WebViewModal — mount-controlled; unmounts on close */}
      {showTickets && event.ticketLink && (
        <WebViewModal url={event.ticketLink} onClose={() => setShowTickets(false)} />
      )}

      {/* Privacy policy in-app webview — mount-controlled, same pattern as tickets */}
      {showPrivacy && privacyPolicyUrl !== '' && (
        <WebViewModal url={privacyPolicyUrl} onClose={() => setShowPrivacy(false)} />
      )}
    </View>
  );
}
