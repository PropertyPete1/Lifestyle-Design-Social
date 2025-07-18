import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalPosts: 0,
    scheduledPosts: 0,
    starredVideos: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { get } = useApi();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [videoStats, postStats, activity] = await Promise.all([
        get('/videos/stats'),
        get('/posts/stats'),
        get('/activity/recent'),
      ]);

      setStats({
        totalVideos: videoStats.stats.totalVideos,
        totalPosts: postStats.totalPosts,
        scheduledPosts: postStats.scheduledPosts,
        starredVideos: videoStats.stats.starredVideos,
      });

      setRecentActivity(activity.activities || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({
    title,
    value,
    icon,
    color,
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const handleUploadVideo = () => {
            // Navigate to videos screen or show upload modal
    // TODO: Implement video upload navigation
  };

  const handleSchedulePost = async () => {
    try {
      const response = await get('/autopost/manual-post');
      if (response.success) {
        // Post scheduled successfully
        loadDashboardData(); // Refresh stats
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
    }
  };

  const handleViewAnalytics = () => {
            // Navigate to analytics screen
    // TODO: Implement analytics navigation
  };

  const handleManageVideos = () => {
            // Navigate to videos screen
    // TODO: Implement videos navigation
  };

  const QuickAction: React.FC<{ title: string; icon: string; onPress: () => void }> = ({
    title,
    icon,
    onPress,
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon as any} size={32} color="#007AFF" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.nameText}>{user?.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          icon="videocam"
          color="#FF6B6B"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon="calendar"
          color="#4ECDC4"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledPosts}
          icon="time"
          color="#45B7D1"
        />
        <StatCard
          title="Starred"
          value={stats.starredVideos}
          icon="star"
          color="#FFA726"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            title="Upload Video"
            icon="cloud-upload"
            onPress={handleUploadVideo}
          />
          <QuickAction
            title="Schedule Post"
            icon="calendar-outline"
            onPress={handleSchedulePost}
          />
          <QuickAction
            title="View Analytics"
            icon="stats-chart"
            onPress={handleViewAnalytics}
          />
          <QuickAction
            title="Manage Videos"
            icon="videocam"
            onPress={handleManageVideos}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity: any, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.description}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    marginRight: '2%',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FCEE09',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
    shadowColor: '#FCEE09',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activityContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#fff',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noActivityText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DashboardScreen; 