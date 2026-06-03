import '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

// Default Firebase app auto-initializes from google-services.json / GoogleService-Info.plist.
// Do NOT call firebase.initializeApp() on native — throws "app already exists" if called twice.
export const db = firestore();
