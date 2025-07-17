import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../contexts/ApiContext';

interface LegalContent {
  title: string;
  lastUpdated: string;
  content: string;
}

interface LegalScreenProps {
  route: {
    params: {
      type: 'terms' | 'privacy';
    };
  };
  navigation: any;
}

const LegalScreen: React.FC<LegalScreenProps> = ({ route, navigation }) => {
  const { get } = useApi();
  const { type } = route.params;
  const [legalContent, setLegalContent] = useState<LegalContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLegalContent();
  }, [type]);

  const loadLegalContent = async () => {
    try {
      setIsLoading(true);
      const endpoint = type === 'terms' ? '/legal/terms' : '/legal/privacy';
      const response = await get(endpoint);
      
      if (response) {
        setLegalContent(response);
      }
    } catch (error) {
      console.error('Failed to load legal content:', error);
      Alert.alert('Error', 'Failed to load legal content');
    } finally {
      setIsLoading(false);
    }
  };

  const formatContent = (content: string) => {
    // Convert markdown-style content to React Native text
    return content
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={styles.title}>
              {line.replace('# ', '')}
            </Text>
          );
        } else if (line.startsWith('## ')) {
          return (
            <Text key={index} style={styles.heading}>
              {line.replace('## ', '')}
            </Text>
          );
        } else if (line.startsWith('### ')) {
          return (
            <Text key={index} style={styles.subheading}>
              {line.replace('### ', '')}
            </Text>
          );
        } else if (line.startsWith('- ')) {
          return (
            <Text key={index} style={styles.listItem}>
              • {line.replace('- ', '')}
            </Text>
          );
        } else {
          return (
            <Text key={index} style={styles.paragraph}>
              {line}
            </Text>
          );
        }
      });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {legalContent?.title || (type === 'terms' ? 'Terms of Service' : 'Privacy Policy')}
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {legalContent?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last updated: {new Date(legalContent.lastUpdated).toLocaleDateString()}
          </Text>
        )}
        
        <View style={styles.contentContainer}>
          {legalContent?.content ? (
            formatContent(legalContent.content)
          ) : (
            <Text style={styles.errorText}>
              Unable to load {type === 'terms' ? 'terms of service' : 'privacy policy'} content.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert(
            'Contact Us',
            'For questions about this document, please contact us at:\n\nlegal@realestateautoposting.com',
            [{ text: 'OK' }]
          )}
        >
          <Ionicons name="mail" size={20} color="#007AFF" />
          <Text style={styles.contactButtonText}>Contact Us</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
    marginTop: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 24,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 4,
    marginLeft: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default LegalScreen; 