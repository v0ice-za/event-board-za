import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { COLORS } from '@/constants/theme';

type WebViewModalProps = {
  url: string;
  onClose: () => void;
};

/**
 * Full-screen in-app webview for ticket links (FR-5 / UX-DR8). Slides up from the
 * bottom; a single pill back button (top-left) always dismisses the ENTIRE modal —
 * it never walks the in-page webview history. Visibility is mount-controlled: the
 * parent (Story 3.3 detail screen) shows the modal by mounting this component and
 * hides it by unmounting on `onClose`, so `visible` is hardcoded true. Purely
 * presentational — no data, navigation, or analytics.
 */
export function WebViewModal({ url, onClose }: WebViewModalProps) {
  return (
    // onRequestClose wires Android hardware-back to the SAME full dismissal as the
    // pill button (UX-DR8) — never a webview step-back.
    <Modal visible animationType="slide" onRequestClose={onClose}>
      {/* A RN Modal renders in a SEPARATE native window, outside the app's root
          SafeAreaProvider — so useSafeAreaInsets() inside it would otherwise resolve
          to 0 (documented react-native-safe-area-context caveat, esp. Android). A
          nested provider restores real insets so the back pill clears the notch. */}
      <SafeAreaProvider>
        <View className="flex-1 bg-background">
          {/* Bare WebView: native loading behaviour only — no spinner/placeholder
              (AC #3). flex:1 is the RN fill idiom; WebView is a third-party native
              component so the inline style is the reliable form (documented
              dynamic-style exception). */}
          <WebView source={{ uri: url }} style={{ flex: 1 }} />
          <BackButton onClose={onClose} />
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}

/**
 * Inset consumer — must live INSIDE the modal's nested SafeAreaProvider so the pill
 * clears the status bar/notch (AC #4). Pressing it dismisses the ENTIRE modal via
 * `onClose`; it never calls a WebView `goBack()` (AC #5 / UX-DR8).
 */
function BackButton({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onClose}
      accessibilityRole="button"
      accessibilityLabel="Back"
      // Absolute offset from the safe-area top inset — depends on a runtime value,
      // so it cannot be a static className (documented dynamic-style exception).
      style={{ top: insets.top + 8, left: 16 }}
      className="absolute min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-background/60"
    >
      <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
    </Pressable>
  );
}
