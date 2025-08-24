import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Calendar, Clock, ChevronLeft, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { getHistory, deleteFromHistory, ScanRecord } from '@/lib/storage';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await getHistory();
      const found = list.find((r) => r.id === params.id);
      setRecord(found || null);
      setLoading(false);
    })();
  }, [params.id]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#059669';
      case 'moderate': return '#D97706';
      case 'high': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle size={20} color="#059669" />;
      case 'moderate': return <AlertTriangle size={20} color="#D97706" />;
      case 'high': return <AlertTriangle size={20} color="#DC2626" />;
      default: return <CheckCircle size={20} color="#6B7280" />;
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Details</Text>
        {record ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert('Delete scan', 'This will permanently delete the scan and image. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                  await deleteFromHistory(record.id, true);
                  router.back();
                } },
              ]);
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : !record ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.missingText}>Record not found.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: record.imageUri }} style={styles.image} resizeMode="cover" />
            </View>

            {/* Meta */}
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.metaText}>{formatDate(record.createdAt)}</Text>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.metaSubtext}>{formatTime(record.createdAt)}</Text>
              </View>
              <View style={styles.metaRow}>
                {getRiskIcon(record.overallRisk)}
                <Text style={[styles.riskLevel, { color: getRiskColor(record.overallRisk) }]}>
                  {record.overallRisk.toUpperCase()} RISK
                </Text>
              </View>
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Primary Finding</Text>
              <Text style={styles.summaryText}>{record.mainCondition}</Text>
              <View style={styles.confidenceBlock}>
                <Text style={styles.confidenceLabel}>Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${Math.round(record.confidence * 100)}%` }]} />
                </View>
                <Text style={styles.confidencePct}>{Math.round(record.confidence * 100)}%</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
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
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  deleteButton: { paddingHorizontal: 12, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  deleteText: { color: '#DC2626', fontWeight: '800' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missingText: { color: '#6B7280', fontSize: 16 },
  scrollView: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24 },
  imageContainer: {
    width: '100%', height: 280, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E5E7EB', marginBottom: 16,
  },
  image: { width: '100%', height: '100%' },
  metaCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  metaText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  metaSubtext: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  riskLevel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  summaryText: { fontSize: 16, color: '#111827', fontWeight: '700', marginBottom: 12 },
  confidenceBlock: { },
  confidenceLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  confidenceBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  confidencePct: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#3B82F6' },
});
