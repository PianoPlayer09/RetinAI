import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface ScanRecord {
  id: string; // uuid-like
  createdAt: string; // ISO string
  imageUri: string; // persistent file path inside documentDirectory
  overallRisk: RiskLevel;
  mainCondition: string;
  confidence: number; // 0..1
}

const HISTORY_KEY = 'scan_history';
const IMAGES_DIR = `${FileSystem.documentDirectory}images`;

async function ensureImagesDir() {
  if (!IMAGES_DIR) return; // safety
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
}

export async function persistCapturedImage(tempUri: string): Promise<string> {
  await ensureImagesDir();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = tempUri.split('.').pop() || 'jpg';
  const dest = `${IMAGES_DIR}/${id}.${ext}`;
  try {
    // copy to keep camera cache intact on some platforms
    await FileSystem.copyAsync({ from: tempUri, to: dest });
    return dest;
  } catch (e) {
    // fallback to original if copy fails
    return tempUri;
  }
}

export async function getHistory(): Promise<ScanRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list: ScanRecord[] = JSON.parse(raw);
    // newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function addToHistory(record: ScanRecord): Promise<void> {
  const list = await getHistory();
  list.unshift(record);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export async function exportHistoryToFile(): Promise<string | null> {
  const list = await getHistory();
  if (!list.length) return null;
  const exportObj = {
    exportedAt: new Date().toISOString(),
    count: list.length,
    scans: list,
  };
  const json = JSON.stringify(exportObj, null, 2);
  const fileUri = `${FileSystem.cacheDirectory}retinai-history-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
  return fileUri;
}

export async function clearHistory() {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function deleteFromHistory(id: string, deleteImage: boolean = true) {
  const list = await getHistory();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const [removed] = list.splice(idx, 1);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  if (deleteImage && removed?.imageUri) {
    try {
      // Only delete if inside our images directory to avoid accidental deletion
      if (removed.imageUri.startsWith(IMAGES_DIR)) {
        await FileSystem.deleteAsync(removed.imageUri, { idempotent: true });
      }
    } catch {}
  }
}
