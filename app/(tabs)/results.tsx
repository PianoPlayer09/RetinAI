import React, { useEffect, useRef } from 'react';
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
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Info, Eye, Calendar, Share } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Mock data - replace with actual AI model results
const mockResults = {
  overallRisk: 'moderate',
  confidence: 0.87,
  diseases: [
    {
      name: 'Diabetic Retinopathy',
      probability: 0.73,
      severity: 'moderate',
      description: 'Blood vessel damage in the retina caused by diabetes',
      recommendations: ['Consult an ophthalmologist immediately', 'Monitor blood sugar levels', 'Schedule regular eye exams'],
    },
    {
      name: 'Macular Degeneration',
      probability: 0.15,
      severity: 'low',
      description: 'Deterioration of the central portion of the retina',
      recommendations: ['Annual eye examinations', 'Maintain healthy diet rich in antioxidants'],
    },
    {
      name: 'Glaucoma',
      probability: 0.08,
      severity: 'low',
      description: 'Increased pressure in the eye leading to optic nerve damage',
      recommendations: ['Regular eye pressure monitoring', 'Consider preventive measures'],
    },
  ],
  scanDate: new Date().toLocaleDateString(),
  scanTime: new Date().toLocaleTimeString(),
};

export default function ResultsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis Results</Text>
        <View style={styles.scanInfo}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.scanDate}>{mockResults.scanDate} at {mockResults.scanTime}</Text>
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
              {getRiskIcon(mockResults.overallRisk)}
              <View style={styles.riskInfo}>
                <Text style={styles.riskTitle}>Overall Risk Assessment</Text>
                <Text style={[styles.riskLevel, { color: getRiskColor(mockResults.overallRisk) }]}>
                  {mockResults.overallRisk.toUpperCase()} RISK
                </Text>
              </View>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Model Confidence</Text>
              <View style={styles.confidenceBar}>
                <View 
                  style={[
                    styles.confidenceFill, 
                    { width: `${mockResults.confidence * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.confidenceText}>{Math.round(mockResults.confidence * 100)}%</Text>
            </View>
          </View>

          {/* Disease Detection Results */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detected Conditions</Text>
            {mockResults.diseases.map((disease, index) => (
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
                  {disease.recommendations.map((rec, recIndex) => (
                    <Text key={recIndex} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
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
            <TouchableOpacity style={styles.shareButton}>
              <Share size={20} color="#2563EB" />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.consultButton}>
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