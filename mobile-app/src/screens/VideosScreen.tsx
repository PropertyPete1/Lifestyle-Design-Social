import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  // Image,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
// import { Video, ResizeMode } from 'expo-av';
// import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2;

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  postCount: number;
  lastPosted?: string;
  category: string;
  status: string;
  createdAt: string;
}

const VideosScreen: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, _setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const api = useApi();
  const { user: _user } = useAuth();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/videos');
      
      if (response.success) {
        setVideos(response.videos || []);
      } else {
        Alert.alert('Error', 'Failed to load videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const handleVideoUpload = async () => {
    try {
              // Video upload functionality requires proper mobile file picker integration
        Alert.alert('Feature Available', 'Video upload functionality requires mobile file picker integration');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload video');
    }
  };

  const handleVideoPress = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
                                             const response = await api.delete(`/videos/${videoId}`);
              if (response.success) {
                fetchVideos();
              } else {
                Alert.alert('Error', 'Failed to delete video');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
    >
      <View style={styles.videoThumbnail}>
        <Ionicons name="play-circle" size={40} color="#fff" />
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.videoMeta}>
          <Text style={styles.metaText}>
            {formatFileSize(item.fileSize)}
          </Text>
          <Text style={styles.metaText}>
            {formatDuration(item.duration)}
          </Text>
        </View>
        
        <View style={styles.videoStats}>
          <Text style={styles.statsText}>
            Posted {item.postCount} times
          </Text>
          {item.lastPosted && (
            <Text style={styles.statsText}>
              Last: {new Date(item.lastPosted).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="videocam-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No Videos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Upload your first real estate video to get started
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleVideoUpload}
        disabled={uploading}
      >
        <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>Upload Video</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Library</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleVideoUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="add" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Video List */}
      {videos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedVideo?.title || 'Video'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVideoModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedVideo && (
            <View style={styles.modalContent}>
              <View style={styles.videoPlayer}>
                <Text style={styles.videoPlaceholder}>
                  Video Player
                </Text>
                <Text style={styles.videoNote}>
                  Video streaming will be implemented with proper video URLs
                </Text>
              </View>
              
              <View style={styles.videoDetails}>
                <Text style={styles.detailTitle}>Details</Text>
                <Text style={styles.detailText}>
                  Category: {selectedVideo.category}
                </Text>
                <Text style={styles.detailText}>
                  Status: {selectedVideo.status}
                </Text>
                <Text style={styles.detailText}>
                  File Size: {formatFileSize(selectedVideo.fileSize)}
                </Text>
                <Text style={styles.detailText}>
                  Duration: {formatDuration(selectedVideo.duration)}
                </Text>
                <Text style={styles.detailText}>
                  Posted: {selectedVideo.postCount} times
                </Text>
                {selectedVideo.description && (
                  <Text style={styles.detailText}>
                    Description: {selectedVideo.description}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  videoItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
  videoStats: {
    marginTop: 4,
  },
  statsText: {
    color: '#666',
    fontSize: 11,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  videoPlayer: {
    height: 200,
    backgroundColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  videoPlaceholder: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  videoNote: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  videoDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
});

export default VideosScreen; 