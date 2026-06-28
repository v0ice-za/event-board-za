import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { WebViewModal } from './WebViewModal';

// jest.mock is hoisted above imports, so its factory may only close over out-of-scope
// vars whose name starts with "mock" (babel-plugin-jest-hoist). MockRnView is read
// lazily at render time — long after this assignment runs — so it resolves to RN's View.
const MockRnView = View;

// react-native-webview is a native module — absent from jest.config transformIgnorePatterns
// and there is no global jest setup. Mock per-file (same approach as the Firestore mocks in
// hooks/*.test.ts). The stub forwards `source` so the test can assert the loaded URL, and
// deliberately exposes NO goBack — proving the back button cannot drive webview history.
jest.mock('react-native-webview', () => ({
  WebView: (props: { source?: { uri?: string } }) => <MockRnView testID="webview" {...props} />,
}));

// The component nests a <SafeAreaProvider> inside the Modal (so insets resolve in the
// modal's separate window) and reads insets via the hook. Mock both: a pass-through
// provider and zero insets — no real provider/measurement needed in the test tree.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

const URL = 'https://tickets.example/e1';

describe('WebViewModal', () => {
  it('(a) renders the WebView at the passed URL', () => {
    render(<WebViewModal url={URL} onClose={() => {}} />);
    expect(screen.getByTestId('webview').props.source).toEqual({ uri: URL });
  });

  it('(b) back button exposes accessibilityLabel "Back" and role button', () => {
    render(<WebViewModal url={URL} onClose={() => {}} />);
    const back = screen.getByLabelText('Back');
    expect(back.props.accessibilityRole).toBe('button');
  });

  it('(c) pressing back dismisses the modal via onClose exactly once', () => {
    const onClose = jest.fn();
    render(<WebViewModal url={URL} onClose={onClose} />);
    fireEvent.press(screen.getByLabelText('Back'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('(d) back is a pure dismissal — no webview-history navigation is wired', () => {
    const onClose = jest.fn();
    render(<WebViewModal url={URL} onClose={onClose} />);
    // A history-stepping back button would have to track the webview's navigation
    // state (canGoBack) via onNavigationStateChange; the bare webview receives no
    // such callback, so pressing back can ONLY dismiss the whole modal (UX-DR8).
    expect(screen.getByTestId('webview').props.onNavigationStateChange).toBeUndefined();
    fireEvent.press(screen.getByLabelText('Back'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
