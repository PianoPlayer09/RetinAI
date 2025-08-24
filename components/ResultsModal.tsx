import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Eye, Calendar, Share, X } from 'lucide-react-native';
import { openFindSpecialist } from '@/lib/openMaps';
import { classifyFromAP } from '@/lib/classifier';

const { width, height } = Dimensions.get('window');

const cls = classifyFromAP();
const scanDate = new Date().toLocaleDateString();
const scanTime = new Date().toLocaleTimeString();

interface ResultsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ResultsModal({ visible, onClose }: ResultsModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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
      case 'low': return <CheckCircle size={28} color="#059669" />;
      case 'moderate': return <AlertTriangle size={28} color="#D97706" />;
      case 'high': return <AlertTriangle size={28} color="#DC2626" />;
      default: return <Info size={28} color="#6B7280" />;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability > 0.7) return '#DC2626';
    if (probability > 0.4) return '#D97706';
    return '#059669';
  };

  const onShare = async () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      results: {
        overallRisk: cls.overallRisk,
        confidence: cls.confidence,
        diseases: cls.all.map(d => ({ name: d.name, probability: d.probability, description: d.description })),
      },
    };
    const json = JSON.stringify(payload, null, 2);
    const fileUri = `${FileSystem.cacheDirectory}retinai-results-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(fileUri, json);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/json' });
    } else {
      alert(`Saved results to: ${fileUri}`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.5)" />
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Analysis Complete</Text>
              <View style={styles.scanInfo}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.scanDate}>{scanDate} at {scanTime}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Overall Risk Card */}
              <View style={styles.overallRiskCard}>
                <View style={styles.riskHeader}>
                  {getRiskIcon(cls.overallRisk)}
                  <View style={styles.riskInfo}>
                    <Text style={styles.riskTitle}>Overall Assessment</Text>
                    <Text style={[styles.riskLevel, { color: getRiskColor(cls.overallRisk) }]}>
                      {cls.overallRisk.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>AI Confidence</Text>
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
                      <Text style={styles.recommendationItem}>• Consult a specialist if non-Normal is likely</Text>
                      <Text style={styles.recommendationItem}>• Maintain regular eye exams and follow medical advice</Text>
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
                    This AI analysis is for screening purposes only and should not replace professional medical diagnosis. 
                    Please consult with a qualified ophthalmologist for proper medical evaluation and treatment.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.shareButton} onPress={onShare}>
              <Share size={18} color="#3B82F6" />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.consultButton} onPress={openFindSpecialist}>
              <Eye size={18} color="#FFFFFF" />
              <Text style={styles.consultButtonText}>Find Specialist</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  scanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  overallRiskCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  riskInfo: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confidenceContainer: {
    gap: 12,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  confidenceBar: {
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
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'right',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  diseaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  diseaseInfo: {
    flex: 1,
    marginRight: 16,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  probabilityContainer: {
    alignItems: 'flex-end',
  },
  probabilityText: {
    fontSize: 18,
    fontWeight: '800',
  },
  probabilityBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
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
    fontWeight: '700',
    color: '#111827',
  },
  recommendationItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  noticeCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  noticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  shareButtonText: {
    color: '#3B82F6',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  consultButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  consultButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});