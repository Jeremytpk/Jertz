import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { LIABILITY_WAIVER_TEXT, MAX_FILE_SIZE_MB, MUSIC_SOURCES } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const UploadScreen = ({ navigation }) => {
  const { user, isGuest } = useAuth();
  const [showWaiver, setShowWaiver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async () => {
    // Check if user is in guest mode
    if (isGuest) {
      Alert.alert(
        'Sign In Required',
        'You need to create an account or sign in to upload music.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        // Check file size
        const fileSizeMB = result.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          Alert.alert('File Too Large', `File must be less than ${MAX_FILE_SIZE_MB}MB`);
          return;
        }

        setSelectedFile(result);
        setShowWaiver(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleAcceptWaiver = async () => {
    setShowWaiver(false);
    setUploading(true);

    // TODO: Upload to Firebase Storage
    setTimeout(() => {
      setUploading(false);
      Alert.alert('Success', 'Track uploaded successfully!');
      setSelectedFile(null);
    }, 2000);
  };

  const handleYouTubeImport = () => {
    // TODO: Implement YouTube OAuth and playlist import
    Alert.alert('Coming Soon', 'YouTube integration will be available soon!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.headerTitle}>Upload</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Upload from Device */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Upload from Device</Text>
          <TouchableOpacity style={styles.uploadCard} onPress={handleFileUpload}>
            <LinearGradient colors={GRADIENTS.accent} style={styles.uploadCardGradient}>
              <Ionicons name="cloud-upload-outline" size={64} color={COLORS.text} />
              <Text style={styles.uploadCardTitle}>Upload Audio File</Text>
              <Text style={styles.uploadCardText}>MP3 or WAV • Max {MAX_FILE_SIZE_MB}MB</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* YouTube Import */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎥 Import from YouTube</Text>
          <TouchableOpacity style={styles.youtubeCard} onPress={handleYouTubeImport}>
            <View style={styles.youtubeCardContent}>
              <Ionicons name="logo-youtube" size={48} color="#FF0000" />
              <View style={styles.youtubeText}>
                <Text style={styles.youtubeTitle}>Connect YouTube</Text>
                <Text style={styles.youtubeSubtext}>Import your playlists</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Uploads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Your Uploads</Text>
          <View style={styles.emptyState}>
            <Ionicons name="musical-notes-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateText}>No uploads yet</Text>
            <Text style={styles.emptyStateSubtext}>Upload your first track to get started</Text>
          </View>
        </View>
      </ScrollView>

      {/* Liability Waiver Modal */}
      <Modal
        visible={showWaiver}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWaiver(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Copyright & Liability Agreement</Text>
            <ScrollView style={styles.waiverScroll}>
              <Text style={styles.waiverText}>{LIABILITY_WAIVER_TEXT}</Text>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowWaiver(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptWaiver}
              >
                <Text style={styles.acceptButtonText}>I Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Uploading Modal */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  uploadCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  uploadCardGradient: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  uploadCardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  uploadCardText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    opacity: 0.8,
  },
  youtubeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
  },
  youtubeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubeText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  youtubeTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  youtubeSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  waiverScroll: {
    maxHeight: 300,
    marginBottom: SPACING.lg,
  },
  waiverText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContent: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
});

export default UploadScreen;
