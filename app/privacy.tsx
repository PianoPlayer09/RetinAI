import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <Text style={styles.paragraph}>
            Images you capture are stored locally on your device. Analysis results can be saved to your history on this device only.
            We do not transmit your images or results to any server unless you explicitly choose to share or export them.
          </Text>

          <Text style={styles.sectionTitle}>Permissions</Text>
          <Text style={styles.paragraph}>
            Camera access is required for image capture. You can revoke access anytime in your device settings.
          </Text>

          <Text style={styles.sectionTitle}>Telemetry</Text>
          <Text style={styles.paragraph}>
            Development builds disable anonymous telemetry. Production builds respect your system privacy settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
});
