import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Eye, Calendar, Share } from 'lucide-react-native';
import { openFindSpecialist } from '@/lib/openMaps';
import { classifyFromAP } from '@/lib/classifier';

const { width } = Dimensions.get('window');

const scanDate = new Date().toLocaleDateString();
const scanTime = new Date().toLocaleTimeString();

export default function ResultsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cls = useMemo(() => classifyFromAP(), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#059669';
      case 'moderate': return '#D97706';
      case 'high': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle size={24} color="#059669" />;
      case 'moderate': return <AlertTriangle size={24} color="#D97706" />;
      case 'high': return <AlertTriangle size={24} color="#DC2626" />;
      default: return <Info size={24} color="#64748B" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return '#DC2626';
    if (probability > 0.4) return '#D97706';
    return '#059669';
  };

  const onShare = async () => {
    try {
      const payload = {
        generatedAt: new Date().toISOString(),
        results: {
          overallRisk: cls.overallRisk,
          confidence: cls.confidence,
          diseases: cls.all.map(d => ({
            name: d.name,
            probability: d.probability,
            description: d.description,
          })),
        },
      };
      const json = JSON.stringify(payload, null, 2);
      const fileUri = `${FileSystem.cacheDirectory}retinai-results-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
      } else {
        // Fallback for platforms without native share (e.g., web)
        alert(`Saved results to: ${fileUri}`);
      }
    } catch (e) {
      alert('Failed to share results');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={styles.scanInfo}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.scanDate}>{scanDate} at {scanTime}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Overall Risk Card */}
          <View style={styles.overallRiskCard}>
            <View style={styles.riskHeader}>
              {getRiskIcon(cls.overallRisk)}
              <View style={styles.riskInfo}>
                <Text style={styles.riskTitle}>Overall Risk Assessment</Text>
                <Text style={[styles.riskLevel, { color: getRiskColor(cls.overallRisk) }]}>
                  {cls.overallRisk.toUpperCase()} RISK
                </Text>
              </View>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Model Confidence</Text>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { width: `${cls.confidence * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.confidenceText}>{Math.round(cls.confidence * 100)}%</Text>
            </View>
          </View>

          {/* Disease Detection Results */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Conditions</Text>
            {cls.all.map((disease, index) => (
              <View key={index} style={styles.diseaseCard}>
                <View style={styles.diseaseHeader}>
                  <View style={styles.diseaseInfo}>
                    <Text style={styles.diseaseName}>{disease.name}</Text>
                    <Text style={styles.diseaseDescription}>{disease.description}</Text>
                  </View>
                  <View style={styles.probabilityContainer}>
                    <Text 
                      style={[
                        styles.probabilityText,
                        { color: getProbabilityColor(disease.probability) }
                      ]}
                    >
                      {Math.round(disease.probability * 100)}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.probabilityBar}>
                  <View 
                    style={[
                      styles.probabilityFill,
                      { 
                        width: `${disease.probability * 100}%`,
                        backgroundColor: getProbabilityColor(disease.probability),
                      }
                    ]} 
                  />
                </View>

                <View style={styles.recommendationsContainer}>
                  <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                  <Text style={styles.recommendationItem}>
                    • Consult an ophthalmologist for confirmation if risk is moderate/high
                  </Text>
                  <Text style={styles.recommendationItem}>
                    • Maintain regular eye exams and follow general eye health guidelines
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Important Notice */}
          <View style={styles.noticeCard}>
            <AlertTriangle size={20} color="#D97706" />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Medical Disclaimer</Text>
              <Text style={styles.noticeText}>
                This analysis is for screening purposes only and should not replace professional medical diagnosis. 
                Please consult with a qualified ophthalmologist for proper medical evaluation and treatment.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Share size={20} color="#2563EB" />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.consultButton} onPress={openFindSpecialist}>
              <Eye size={20} color="#FFFFFF" />
              <Text style={styles.consultButtonText}>Find Ophthalmologist</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  scanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanDate: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  overallRiskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '700',
  },
  confidenceContainer: {
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'right',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  diseaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  diseaseInfo: {
    flex: 1,
    marginRight: 12,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  probabilityContainer: {
    alignItems: 'flex-end',
  },
  probabilityText: {
    fontSize: 18,
    fontWeight: '700',
  },
  probabilityBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsContainer: {
    gap: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  recommendationItem: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    gap: 8,
  },
  shareButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  consultButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    gap: 8,
  },
  consultButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});