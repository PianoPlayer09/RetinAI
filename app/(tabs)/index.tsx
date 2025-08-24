import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addToHistory, persistCapturedImage } from '@/lib/storage';
import { classifyFromAP } from '@/lib/classifier';
import { Camera, RotateCcw, Check, Zap, X, ImagePlus } from 'lucide-react-native';
import { router } from 'expo-router';
import ResultsModal from '@/components/ResultsModal';

const { width, height } = Dimensions.get('window');
const CAMERA_SIZE = Math.min(width * 0.85, 320);

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasWarnedFlash, setHasWarnedFlash] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false); // post-capture buffer
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const flashAnim = useRef(new Animated.Value(0)).current; // visual screen flash

  useEffect(() => {
    if (!capturedImage) {
      // Pulse animation for scan button
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, []);

  useEffect(() => {
    if (capturedImage) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [capturedImage]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.permissionIcon}>
          <Camera size={48} color="#3B82F6" strokeWidth={1.5} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to capture high-quality retinal images for accurate AI analysis.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startFlashOverlay = () => {
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const doCapture = async () => {
    if (cameraRef.current) {
      try {
        setIsPreparing(true);
        startFlashOverlay();
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });
        const savedUri = await persistCapturedImage(photo.uri);
        setCapturedImage(savedUri);
        // brief buffer to simulate pre-processing window for future model
        setTimeout(() => setIsPreparing(false), 2200);
      } catch (error) {
        setIsPreparing(false);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const takePicture = async () => {
    if (!hasWarnedFlash) {
      Alert.alert(
        'Flash Warning',
        'The flashlight/flash will activate during capture. Avoid direct eye exposure.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'default', onPress: () => { setHasWarnedFlash(true); doCapture(); } },
        ]
      );
      return;
    }
    await doCapture();
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        base64: false,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const savedUri = await persistCapturedImage(uri);
        setCapturedImage(savedUri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image from gallery');
    }
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    
    // TODO: Replace with your actual AI model endpoint
    // const apiEndpoint = 'YOUR_AI_MODEL_ENDPOINT_HERE';
    // const formData = new FormData();
    // formData.append('image', {
    //   uri: capturedImage,
    //   type: 'image/jpeg',
    //   name: 'retinal_image.jpg',
    // } as any);
    
    // try {
    //   const response = await fetch(apiEndpoint, {
    //     method: 'POST',
    //     body: formData,
    //     headers: {
    //       'Content-Type': 'multipart/form-data',
    //       'Authorization': 'Bearer YOUR_API_KEY_HERE',
    //     },
    //   });
    //   const result = await response.json();
    //   // Handle the AI model response
    // } catch (error) {
    //   console.error('AI Analysis Error:', error);
    // }

    // Mock analysis delay
    setTimeout(async () => {
      setIsAnalyzing(false);
      setShowResults(true);
      // Save to history with current date/time using classifier
      if (capturedImage) {
        const cls = classifyFromAP();
        await addToHistory({
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          imageUri: capturedImage,
          overallRisk: cls.overallRisk,
          mainCondition: cls.predicted.name,
          confidence: cls.confidence,
        });
      }
      // Navigate to Results tab
      router.push('/results' as any);
    }, 3000);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowResults(false);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (capturedImage) {
    return (
      <>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={retakePhoto}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Review Capture</Text>
              <Text style={styles.headerSubtitle}>Ensure retinal details are clear and focused</Text>
            </View>
          </View>
        </View>

          <Animated.View 
            style={[
              styles.previewContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <View style={styles.imagePreview}>
              {capturedImage ? (
                <Image source={{ uri: capturedImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={styles.mockImagePreview}>
                  <View style={styles.mockRetina} />
                  <Text style={styles.mockImageText}>Retinal Image Captured</Text>
                </View>
              )}
            </View>
          </Animated.View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <RotateCcw size={20} color="#6B7280" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.analyzeButton, isAnalyzing && styles.analyzingButton]} 
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Zap size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.analyzeButtonText}>Analyze</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        
        <ResultsModal 
          visible={showResults} 
          onClose={() => {
            setShowResults(false);
            retakePhoto();}}
        />
        {isPreparing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingTitle}>Preparing image…</Text>
              <Text style={styles.loadingSubtitle}>This may take a few seconds</Text>
            </View>
          </View>
        )}
      </>
    );
  }

  return (
    <><View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Retinal Analysis</Text>
        <Text style={styles.headerSubtitle}>Position camera for optimal retinal capture</Text>
      </View>
    </View>
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={true}
        flash={'on'}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.instructionText}>
            Center retina within frame
          </Text>
        </View>
        {/* Visual flash overlay */}
        <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flashAnim }]} />
      </CameraView>
    </View>
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.flipButton}
        onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
      >
        <RotateCcw size={22} color="#6B7280" />
      </TouchableOpacity>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner}>
            <View style={styles.captureButtonCore} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={styles.flipButton}
        onPress={pickFromGallery}
        accessibilityLabel="Upload from gallery"
      >
        <ImagePlus size={22} color="#6B7280" />
      </TouchableOpacity>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    width: Math.min(width * 0.8, 320),
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  loadingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    maxWidth: 280,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F9FAFB',
  },
  camera: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scanFrame: {
    width: CAMERA_SIZE * 0.75,
    height: CAMERA_SIZE * 0.75,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3B82F6',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3B82F6',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3B82F6',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#3B82F6',
    borderBottomRightRadius: 8,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 52,
    height: 52,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F9FAFB',
  },
  imagePreview: {
    width: CAMERA_SIZE,
    height: CAMERA_SIZE,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  mockImagePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    position: 'relative',
  },
  mockRetina: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#DC2626',
    marginBottom: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  mockImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  retakeButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzingButton: {
    backgroundColor: '#2563EB',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});