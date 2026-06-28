import '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';

// Default Firebase app auto-initializes from google-services.json / GoogleService-Info.plist.
// Do NOT call firebase.initializeApp() on native — throws "app already exists" if called twice.
// Use the modular getFirestore() accessor (not the namespaced firestore()) so `db` is typed as
// the modular `Firestore` the v24 modular query API (collection/query/where/...) expects.
// getFirestore() retrieves the existing default-app instance — it does not re-initialize.
export const db = getFirestore();
