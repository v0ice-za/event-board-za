import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORY_META: Record<string, { icon: string }> = {
  'All':          { icon: '⚡' },
  'Music':        { icon: '🎵' },
  'Markets':      { icon: '🛍️' },
  'Food & Drink': { icon: '🍽️' },
  'Art & Culture':{ icon: '🎨' },
  'Sport':        { icon: '⚽' },
  'Comedy':       { icon: '😂' },
  'Family':       { icon: '🎡' },
  'Nightlife':    { icon: '🌙' },
};

const CATEGORIES = Object.keys(CATEGORY_META);

const EVENTS = [
  {
    id: '1',
    title: 'Sama Vibez Summer Festival',
    category: 'Music',
    date: 'Sat 7 Jun',
    venue: 'Expo Centre, Nasrec',
    price: 'R350',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=85',
    featured: true,
    badge: 'SELLING FAST',
    going: 847,
  },
  {
    id: '2',
    title: 'Neighbourgoods Market',
    category: 'Markets',
    date: 'Sun 8 Jun',
    venue: 'Braamfontein',
    price: 'Free',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=85',
    going: 312,
  },
  {
    id: '3',
    title: 'Eat Out Restaurant Awards',
    category: 'Food & Drink',
    date: 'Fri 6 Jun',
    venue: 'Sandton Convention Centre',
    price: 'R180',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85',
    badge: 'TONIGHT',
    going: 204,
  },
  {
    id: '4',
    title: 'Joburg Art Fair 2026',
    category: 'Art & Culture',
    date: 'Sat 7 Jun',
    venue: 'Sandton City',
    price: 'R120',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=900&q=85',
    going: 156,
  },
  {
    id: '5',
    title: 'Chiefs vs Pirates — Derby',
    category: 'Sport',
    date: 'Sun 8 Jun',
    venue: 'FNB Stadium, Soweto',
    price: 'R200',
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=85',
    badge: 'SELLING FAST',
    going: 1204,
  },
  {
    id: '6',
    title: 'Loyiso Gola: Live at Monte',
    category: 'Comedy',
    date: 'Thu 5 Jun',
    venue: 'Montecasino, Fourways',
    price: 'R250',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=900&q=85',
    going: 98,
  },
  {
    id: '7',
    title: 'Dino Park Family Day',
    category: 'Family',
    date: 'Sat 7 Jun',
    venue: 'Sci-Bono, Newtown',
    price: 'R90',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&q=85',
    going: 431,
  },
  {
    id: '8',
    title: 'Amnesia Saturday Sessions',
    category: 'Nightlife',
    date: 'Sat 7 Jun',
    venue: 'Melville, JHB',
    price: 'R150',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&q=85',
    going: 567,
  },
];

type Event = typeof EVENTS[number];

function EventCard({ event, hero = false }: { event: Event; hero?: boolean }) {
  const [saved, setSaved] = useState(false);
  const height = hero ? 360 : 248;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={{ borderRadius: 24, overflow: 'hidden', height }}
    >
      {/* Background image */}
      <Image
        source={{ uri: event.image }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit="cover"
        transition={300}
      />

      {/* Top scrim — keeps badge + heart readable over any image */}
      <LinearGradient
        colors={['rgba(15,12,9,0.65)', 'transparent']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90 }}
      />

      {/* Bottom gradient — readable text over any image */}
      <LinearGradient
        colors={['transparent', 'rgba(15,12,9,0.6)', 'rgba(15,12,9,0.97)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: hero ? 260 : 190 }}
      />

      {/* Top row: badge + save */}
      <View style={{ position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {event.badge ? (
          <View style={{
            backgroundColor: event.badge === 'TONIGHT' ? '#FF6B35' : 'rgba(15,12,9,0.55)',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: event.badge === 'TONIGHT' ? '#FF6B35' : 'rgba(255,107,53,0.5)',
          }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 10,
              color: event.badge === 'TONIGHT' ? '#fff' : '#FF6B35',
              letterSpacing: 1.2,
            }}>
              {event.badge}
            </Text>
          </View>
        ) : <View />}

        <TouchableOpacity
          onPress={() => setSaved((s) => !s)}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: 'rgba(15,12,9,0.55)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>{saved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom content */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 }}>
        {/* Category + going */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{
            backgroundColor: '#FF6B35',
            borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff' }}>
              {CATEGORY_META[event.category]?.icon} {event.category}
            </Text>
          </View>
          {event.going > 0 && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(245,240,232,0.6)' }}>
              🔥 {event.going.toLocaleString()} going
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={{
          fontFamily: 'Inter_700Bold',
          fontSize: hero ? 24 : 19,
          color: '#F5F0E8',
          lineHeight: hero ? 30 : 25,
          marginBottom: 8,
        }}>
          {event.title}
        </Text>

        {/* Date + venue + price */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(245,240,232,0.6)', flex: 1, marginRight: 12 }}>
            📅 {event.date} · {event.venue}
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,107,53,0.18)',
            borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
            borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FF6B35' }}>
              {event.price}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? EVENTS
    : EVENTS.filter((e) => e.category === activeCategory);

  const [hero, ...rest] = filtered;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0C09' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, color: '#F5F0E8', letterSpacing: -0.5 }}>
              Event Board ZA
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#8A7E70', marginTop: 2 }}>
              📍 Johannesburg · What&apos;s on this week
            </Text>
          </View>
          <TouchableOpacity style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: '#1C1814',
            borderWidth: 1, borderColor: '#2A2420',
            alignItems: 'center', justifyContent: 'center',
            marginTop: 4,
          }}>
            <Text style={{ fontSize: 17 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category chips */}
      <View style={{ height: 42 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
          style={{ flex: 1 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
                  backgroundColor: active ? '#FF6B35' : '#1C1814',
                  borderWidth: 1,
                  borderColor: active ? '#FF6B35' : '#2A2420',
                }}
              >
                <Text style={{
                  fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  fontSize: 13,
                  color: active ? '#fff' : '#8A7E70',
                }}>
                  {CATEGORY_META[cat]?.icon} {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: '#1C1814', marginTop: 14, marginHorizontal: 20 }} />

      {/* Feed */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        {filtered.length > 0 && (
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#8A7E70', letterSpacing: 1.2, marginBottom: 2 }}>
            {activeCategory === 'All' ? 'THIS WEEK IN JHB' : activeCategory.toUpperCase()}
          </Text>
        )}

        {/* Hero card */}
        {hero && <EventCard event={hero} hero />}

        {/* Rest of cards */}
        {rest.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* End of feed */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 40, height: 1, backgroundColor: '#2A2420', marginBottom: 12 }} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#2A2420' }}>
            {filtered.length === 1
              ? `1 event · check back soon`
              : `${filtered.length} events · updated daily`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
