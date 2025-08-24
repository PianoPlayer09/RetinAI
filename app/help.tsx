import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';

const FAQ = [
  { q: 'How do I capture a good retinal image?', a: 'Ensure proper lighting, keep the device steady, and center the retina within the scan frame.' },
  { q: 'Is this a medical diagnosis?', a: 'No. Results are for screening only and do not replace a professional medical diagnosis.' },
  { q: 'Where are my images stored?', a: 'Images and results are stored locally on your device unless you explicitly share or export them.' },
  { q: 'Can I export my data?', a: 'Yes. Go to Settings → Privacy & Security → Data Export to download your scan history.' },
];

export default function HelpScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {FAQ.map((item, idx) => (
            <View key={idx} style={styles.faqItem}>
              <Text style={styles.question}>{item.q}</Text>
              <Text style={styles.answer}>{item.a}</Text>
            </View>
          ))}
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
  closeButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24 },
  faqItem: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  question: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  answer: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
