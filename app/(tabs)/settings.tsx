import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
} from 'react-native';
import { User, Bell, Shield, CircleHelp as HelpCircle, FileText, ChevronRight, Camera, Database, Smartphone, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [autoSave, setAutoSave] = React.useState(true);
  const [highQuality, setHighQuality] = React.useState(false);

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingsRow = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || <ChevronRight size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your AI analysis experience</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <SettingsSection title="Account">
            <SettingsRow
              icon={<User size={20} color="#3B82F6" />}
              title="Profile"
              subtitle="Manage your account information"
              onPress={() => {}}
            />
          </SettingsSection>

          <SettingsSection title="Camera & Analysis">
            <SettingsRow
              icon={<Camera size={20} color="#3B82F6" />}
              title="Image Quality"
              subtitle="Use high resolution for better analysis"
              rightElement={
                <Switch
                  value={highQuality}
                  onValueChange={setHighQuality}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={highQuality ? '#3B82F6' : '#6B7280'}
                />
              }
            />
            <SettingsRow
              icon={<Database size={20} color="#3B82F6" />}
              title="Auto-save Results"
              subtitle="Automatically save scan results to history"
              rightElement={
                <Switch
                  value={autoSave}
                  onValueChange={setAutoSave}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={autoSave ? '#3B82F6' : '#6B7280'}
                />
              }
            />
          </SettingsSection>

          <SettingsSection title="Notifications">
            <SettingsRow
              icon={<Bell size={20} color="#3B82F6" />}
              title="Push Notifications"
              subtitle="Get notified about scan results and reminders"
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={notifications ? '#3B82F6' : '#6B7280'}
                />
              }
            />
            <SettingsRow
              icon={<Smartphone size={20} color="#3B82F6" />}
              title="Reminder Settings"
              subtitle="Set up regular scan reminders"
              onPress={() => {}}
            />
          </SettingsSection>

          <SettingsSection title="Privacy & Security">
            <SettingsRow
              icon={<Shield size={20} color="#3B82F6" />}
              title="Privacy Settings"
              subtitle="Control how your data is used"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<FileText size={20} color="#3B82F6" />}
              title="Data Export"
              subtitle="Download your scan history"
              onPress={() => {}}
            />
          </SettingsSection>

          <SettingsSection title="Support">
            <SettingsRow
              icon={<HelpCircle size={20} color="#3B82F6" />}
              title="Help & FAQ"
              subtitle="Get help with using the app"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<Info size={20} color="#3B82F6" />}
              title="Terms & Privacy"
              subtitle="Review our policies"
              onPress={() => {}}
            />
          </SettingsSection>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Version 1.0.0</Text>
            <Text style={styles.footerSubtext}>
              AI-powered retinal analysis for screening purposes only. Not a replacement for professional medical diagnosis.
            </Text>
          </View>
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
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  settingsRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  footerSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    fontWeight: '500',
  },
});