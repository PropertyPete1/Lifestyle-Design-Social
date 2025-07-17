import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  // Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../contexts/ApiContext';

interface UserSettings {
  autoPostingEnabled: boolean;
  postingTimes: string[];
  platforms: {
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
  };
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  notifications: {
    postSuccess: boolean;
    postFailure: boolean;
    dailyReports: boolean;
    lowContent: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    crashReporting: boolean;
  };
  advanced: {
    testMode: boolean;
    debugMode: boolean;
    autoSync: boolean;
  };
}

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { get, post, put } = useApi();
  const [settings, setSettings] = useState<UserSettings>({
    autoPostingEnabled: true,
    postingTimes: ['09:00', '13:00', '18:00'],
    platforms: {
      instagram: true,
      tiktok: true,
      youtube: false,
    },
    videoQuality: 'high',
    notifications: {
      postSuccess: true,
      postFailure: true,
      dailyReports: true,
      lowContent: true,
    },
    privacy: {
      dataCollection: true,
      analytics: true,
      crashReporting: true,
    },
    advanced: {
      testMode: false,
      debugMode: false,
      autoSync: true,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await get('/settings');
      
      // Standardize the response format
      if (response) {
        const standardizedSettings = {
          autoPostingEnabled: response.postingSchedule?.enabled ?? true,
          postingTimes: response.postingSchedule?.preferredTimes ?? ['09:00', '13:00', '18:00'],
          platforms: {
            instagram: response.platforms?.instagram?.connected ?? false,
            tiktok: response.platforms?.tiktok?.connected ?? false,
            youtube: response.platforms?.youtube?.connected ?? false,
          },
          videoQuality: 'high' as const,
          notifications: {
            postSuccess: response.notifications?.postSuccess ?? true,
            postFailure: response.notifications?.postFailure ?? true,
            dailyReports: response.notifications?.email ?? true,
            lowContent: response.notifications?.lowContent ?? true,
          },
          privacy: {
            dataCollection: true,
            analytics: true,
            crashReporting: true,
          },
          advanced: {
            testMode: false,
            debugMode: false,
            autoSync: true,
          },
        };
        
        setSettings(prev => ({ ...prev, ...standardizedSettings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Convert mobile settings format to backend format
      const backendSettings = {
        postingSchedule: {
          enabled: settings.autoPostingEnabled,
          postsPerDay: 3,
          preferredTimes: settings.postingTimes,
          timezone: 'America/Chicago',
        },
        notifications: {
          email: settings.notifications.dailyReports,
          push: true,
          postSuccess: settings.notifications.postSuccess,
          postFailure: settings.notifications.postFailure,
          lowContent: settings.notifications.lowContent,
        },
        content: {
          autoGenerateCaptions: true,
          useTrendingHashtags: true,
          includeLocation: true,
          watermark: false,
        },
      };
      
      const response = await put('/settings', backendSettings);
      if (response.success || response.message) {
        Alert.alert('Success', 'Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof UserSettings] as any),
        [key]: value,
      },
    }));
  };

  const addPostingTime = () => {
    if (newTime && !settings.postingTimes.includes(newTime)) {
      setSettings(prev => ({
        ...prev,
        postingTimes: [...prev.postingTimes, newTime].sort(),
      }));
      setNewTime('');
      setShowTimeModal(false);
    }
  };

  const editPostingTime = (index: number) => {
    setEditingTimeIndex(index);
    setNewTime(settings.postingTimes[index]);
    setShowTimeModal(true);
  };

  const updatePostingTime = () => {
    if (editingTimeIndex !== null && newTime) {
      const updatedTimes = [...settings.postingTimes];
      updatedTimes[editingTimeIndex] = newTime;
      setSettings(prev => ({
        ...prev,
        postingTimes: updatedTimes.sort(),
      }));
      setEditingTimeIndex(null);
      setNewTime('');
      setShowTimeModal(false);
    }
  };

  const removePostingTime = (index: number) => {
    setSettings(prev => ({
      ...prev,
      postingTimes: prev.postingTimes.filter((_, i) => i !== index),
    }));
  };

  const updateProfile = async () => {
    try {
      const response = await put('/api/auth/profile', profileData);
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await post('/api/settings/clear-cache', {});
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const syncData = async () => {
    try {
      const response = await post('/api/settings/sync', {});
      if (response.success) {
        Alert.alert('Success', 'Data synchronized successfully');
        loadSettings();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Error', 'Failed to sync data');
    }
  };

  const renderSettingItem = (
    title: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#007AFF' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        {renderSection('Profile', (
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={() => setShowProfileModal(true)}
          >
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}

        {/* Auto Posting Section */}
        {renderSection('Auto Posting', (
          <>
            {renderSettingItem(
              'Enable Auto Posting',
              settings.autoPostingEnabled,
              (value) => updateSetting('autoPostingEnabled', value),
              'Automatically post videos based on schedule'
            )}
            
            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>Posting Times</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowTimeModal(true)}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            {settings.postingTimes.map((time, index) => (
              <View key={index} style={styles.timeItem}>
                <Text style={styles.timeText}>{time}</Text>
                <View style={styles.timeActions}>
                  <TouchableOpacity
                    style={styles.timeActionButton}
                    onPress={() => editPostingTime(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeActionButton}
                    onPress={() => removePostingTime(index)}
                  >
                    <Ionicons name="trash" size={16} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ))}

        {/* Platforms Section */}
        {renderSection('Platforms', (
          <>
            {renderSettingItem(
              'Instagram',
              settings.platforms.instagram,
              (value) => updateNestedSetting('platforms', 'instagram', value),
              'Post to Instagram Reels'
            )}
            {renderSettingItem(
              'TikTok',
              settings.platforms.tiktok,
              (value) => updateNestedSetting('platforms', 'tiktok', value),
              'Post to TikTok'
            )}
            {renderSettingItem(
              'YouTube',
              settings.platforms.youtube,
              (value) => updateNestedSetting('platforms', 'youtube', value),
              'Post to YouTube Shorts'
            )}
          </>
        ))}

        {/* Video Quality Section */}
        {renderSection('Video Quality', (
          <View style={styles.qualityContainer}>
            {['low', 'medium', 'high', 'ultra'].map((quality) => (
              <TouchableOpacity
                key={quality}
                style={[
                  styles.qualityOption,
                  settings.videoQuality === quality && styles.qualityOptionSelected
                ]}
                onPress={() => updateSetting('videoQuality', quality)}
              >
                <Text style={[
                  styles.qualityText,
                  settings.videoQuality === quality && styles.qualityTextSelected
                ]}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Notifications Section */}
        {renderSection('Notifications', (
          <>
            {renderSettingItem(
              'Post Success',
              settings.notifications.postSuccess,
              (value) => updateNestedSetting('notifications', 'postSuccess', value),
              'Notify when posts are successful'
            )}
            {renderSettingItem(
              'Post Failure',
              settings.notifications.postFailure,
              (value) => updateNestedSetting('notifications', 'postFailure', value),
              'Notify when posts fail'
            )}
            {renderSettingItem(
              'Daily Reports',
              settings.notifications.dailyReports,
              (value) => updateNestedSetting('notifications', 'dailyReports', value),
              'Receive daily performance reports'
            )}
            {renderSettingItem(
              'Low Content Warning',
              settings.notifications.lowContent,
              (value) => updateNestedSetting('notifications', 'lowContent', value),
              'Notify when running low on content'
            )}
          </>
        ))}

        {/* Privacy Section */}
        {renderSection('Privacy', (
          <>
            {renderSettingItem(
              'Data Collection',
              settings.privacy.dataCollection,
              (value) => updateNestedSetting('privacy', 'dataCollection', value),
              'Allow collection of usage data'
            )}
            {renderSettingItem(
              'Analytics',
              settings.privacy.analytics,
              (value) => updateNestedSetting('privacy', 'analytics', value),
              'Enable analytics tracking'
            )}
            {renderSettingItem(
              'Crash Reporting',
              settings.privacy.crashReporting,
              (value) => updateNestedSetting('privacy', 'crashReporting', value),
              'Send crash reports to improve app'
            )}
          </>
        ))}

        {/* Advanced Section */}
        {renderSection('Advanced', (
          <>
            {renderSettingItem(
              'Test Mode',
              settings.advanced.testMode,
              (value) => updateNestedSetting('advanced', 'testMode', value),
              'Enable test mode for debugging'
            )}
            {renderSettingItem(
              'Debug Mode',
              settings.advanced.debugMode,
              (value) => updateNestedSetting('advanced', 'debugMode', value),
              'Show debug information'
            )}
            {renderSettingItem(
              'Auto Sync',
              settings.advanced.autoSync,
              (value) => updateNestedSetting('advanced', 'autoSync', value),
              'Automatically sync data'
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={syncData}>
              <Ionicons name="sync" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Sync Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
              <Ionicons name="trash" size={20} color="#ff3b30" />
              <Text style={[styles.actionButtonText, { color: '#ff3b30' }]}>Clear Cache</Text>
            </TouchableOpacity>
          </>
        ))}

        {/* Legal Section */}
        {renderSection('Legal', (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Legal', { type: 'terms' })}
            >
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
            >
              <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Privacy Policy</Text>
            </TouchableOpacity>
          </>
        ))}

        {/* Account Actions */}
        {renderSection('Account', (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#ff3b30" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time Modal */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTimeIndex !== null ? 'Edit Posting Time' : 'Add Posting Time'}
            </Text>
            
            <TextInput
              style={styles.timeInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="HH:MM (e.g., 09:00)"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTimeModal(false);
                  setEditingTimeIndex(null);
                  setNewTime('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={editingTimeIndex !== null ? updatePostingTime : addPostingTime}
              >
                <Text style={styles.confirmButtonText}>
                  {editingTimeIndex !== null ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <TextInput
              style={styles.textInput}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              placeholder="Name"
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={styles.textInput}
              value={profileData.email}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={updateProfile}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    padding: 8,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeText: {
    fontSize: 16,
    color: '#000',
  },
  timeActions: {
    flexDirection: 'row',
  },
  timeActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  qualityContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: '#007AFF',
  },
  qualityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  qualityTextSelected: {
    color: '#fff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ff3b30',
    marginLeft: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default SettingsScreen; 