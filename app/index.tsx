import { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { AdBannerUnit } from '@/components/AdBannerUnit';
import { ChipsRow } from '@/components/ChipsRow';
import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SkeletonCard } from '@/components/SkeletonCard';
import { SkeletonChipsRow } from '@/components/SkeletonChipsRow';
import { useEvents } from '@/hooks/useEvents';
import { useNetworkState } from '@/hooks/useNetworkState';
import { logCategoryFilter, logScreenView } from '@/lib/analytics';
import type { Category, Event } from '@/types';

// FR-9: a live <AdBannerUnit/> is interleaved at every Nth feed position.
const AD_INTERVAL = 6;

/**
 * Feed screen (Epic 2 capstone). Composes ChipsRow + useEvents + EventCard/SkeletonCard +
 * EmptyState/OfflineBanner + useNetworkState into the live JHB event feed. UI state
 * (active category) is session-local useState; server state is TanStack Query via useEvents.
 * Navigation (router.push) lives here per the screen-only navigation boundary.
 */
export default function FeedScreen() {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const { events, isLoading, isError, refetch } = useEvents(activeCategory);
  const { isConnected } = useNetworkState();
  const router = useRouter();
  const listRef = useRef<FlatList<Event>>(null);
  // Top safe-area inset applied via the hook (not <SafeAreaView>) so the screen composes a
  // plain View — avoids the NativeWind×safe-area-context cssInterop wrapper. Provider lives
  // in app/_layout.tsx. paddingTop is runtime-driven → the documented dynamic-style exception.
  const insets = useSafeAreaInsets();

  // UX-DR12: on return to foreground, reset the feed to top + soft background refresh.
  // Soft because useEvents.isLoading is cold-load-only — refetch() will not re-skeleton.
  // refetch is held in a ref so the listener subscribes exactly once: useEvents returns a
  // fresh refetch identity each render, so [refetch] deps would re-subscribe every render.
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appState.current;
      appState.current = next;
      // Only a true background→active transition refreshes. iOS emits a transient
      // `inactive` for Control Center / notification shade / biometric prompts — those
      // must NOT scroll-to-top or refetch (would yank the user mid-scroll).
      if (next === 'active' && prev === 'background') {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        refetchRef.current();
      }
    });
    return () => sub.remove();
  }, []);

  // Analytics: log the feed screen view once on mount. Above the early return below so it
  // is rules-of-hooks safe (effects must run on every render path).
  useEffect(() => {
    logScreenView('Feed');
  }, []);

  // FR-7: tapping the active chip (or "All") resets to all events; ChipsRow emits the
  // tapped category itself and does not self-toggle, so the toggle-off lives here.
  const handleSelect = (category: Category | null) => {
    // Log only a real new selection. Skip the All chip (null) and the toggle-off case
    // (tapping the already-active chip, which clears the filter back to All).
    if (category !== null && category !== activeCategory) {
      logCategoryFilter(category);
    }
    setActiveCategory((prev) => (prev === category ? null : category));
  };

  // Initial cold load only (AC #5): full skeleton — skeleton chips + exactly 3 skeleton
  // cards, no spinner. Gated to the first load (activeCategory === null); a per-category
  // cold load keeps the interactive ChipsRow and skeletons only the list region (below).
  if (isLoading && activeCategory === null) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <StatusBar style="light" />
        <View className="px-4 py-3">
          <SkeletonChipsRow />
        </View>
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  // Render-precedence (first match wins): per-category cold load → offline-empty →
  // error-empty → empty → list.
  const renderBody = () => {
    // Per-category cold load (activeCategory !== null): ChipsRow stays mounted above;
    // skeleton only the list region so the user keeps their chip anchor on a filter tap.
    if (isLoading) {
      return (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    if (!isConnected && events.length === 0) {
      return <EmptyState variant="no-connection" onAction={refetch} />;
    }
    if (isError && events.length === 0) {
      return <EmptyState variant="general-error" onAction={refetch} />;
    }
    if (events.length === 0) {
      return (
        <EmptyState
          variant="empty-category"
          category={activeCategory}
          onAction={() => setActiveCategory(null)}
        />
      );
    }
    return (
      <>
        {!isConnected && <OfflineBanner />}
        <FlatList
          ref={listRef}
          data={events}
          keyExtractor={(item) => item.id}
          accessible={false}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <>
              <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
              {/* Ad after every 6th card, but never as the final row (index + 1 < length)
                  so a feed whose length is an exact multiple of 6 doesn't end on an ad. */}
              {(index + 1) % AD_INTERVAL === 0 && index + 1 < events.length && (
                <AdBannerUnit testID="feed-ad-slot" />
              )}
            </>
          )}
        />
      </>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View className="px-4 py-3">
        <ChipsRow activeCategory={activeCategory} onSelect={handleSelect} />
      </View>
      <View className="flex-1">{renderBody()}</View>
    </View>
  );
}
