import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Calendar, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ChevronRight, Activity } from 'lucide-react-native';
import { getHistory, ScanRecord } from '@/lib/storage';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const unsub = setInterval(async () => {
      // refresh periodically to reflect new scans
      const list = await getHistory();
      setHistory(list);
    }, 1000);
    (async () => setHistory(await getHistory()))();
    return () => clearInterval(unsub);
  }, []);

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

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <Text style={styles.headerSubtitle}>Review your previous retinal analyses</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {history.map((scan) => (
            <TouchableOpacity key={scan.id} style={styles.historyCard} onPress={() => router.push({ pathname: '/history/[id]', params: { id: scan.id } })}>
              <View style={styles.cardHeader}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.dateText}>{formatDate(scan.createdAt)}</Text>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.timeText}>{formatTime(scan.createdAt)}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.riskContainer}>
                  {getRiskIcon(scan.overallRisk)}
                  <View style={styles.riskInfo}>
                    <Text style={styles.conditionText}>{scan.mainCondition}</Text>
                    <Text style={[styles.riskText, { color: getRiskColor(scan.overallRisk) }]}>
                      {scan.overallRisk.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>

                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <View style={styles.confidenceBar}>
                    <View 
                      style={[
                        styles.confidenceFill, 
                        { width: `${scan.confidence * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.confidenceText}>{Math.round(scan.confidence * 100)}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {history.length === 0 && (
            <View style={styles.emptyState}>
              <Activity size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Scans Yet</Text>
              <Text style={styles.emptyText}>
                Your scan history will appear here after you complete your first retinal analysis.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  timeText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardContent: {
    gap: 20,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  riskInfo: {
    flex: 1,
  },
  conditionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  riskText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  confidenceLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
    width: 90,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
    width: 45,
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    fontWeight: '500',
  },
});