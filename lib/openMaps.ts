import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';

export async function openFindSpecialist() {
  const search = 'ophthalmologist near me';
  const encoded = encodeURIComponent(search);
  let url = '';

  if (Platform.OS === 'ios') {
    // Apple Maps defaults to near current location
    url = `http://maps.apple.com/?q=${encodeURIComponent('ophthalmologist')}`;
  } else if (Platform.OS === 'android') {
    // Geo URI pattern with query
    url = `geo:0,0?q=${encoded}`;
  } else {
    // Web / fallback
    url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      // fallback to Google Maps web URL if initial scheme unsupported
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      await Linking.openURL(webUrl);
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    Alert.alert('Unable to open maps', 'Please try again or search for ophthalmologists in your maps app.');
  }
}
