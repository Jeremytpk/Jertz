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
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { LIABILITY_WAIVER_TEXT, MAX_FILE_SIZE_MB, MUSIC_SOURCES } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const UploadScreen = ({ navigation }) => {
  const { user, isGuest } = useAuth();
  const [showWaiver, setShowWaiver] = useState(false);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');

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
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      console.log('DocumentPicker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          Alert.alert('File Too Large', `File must be less than ${MAX_FILE_SIZE_MB}MB`);
          return;
        }

        setSelectedFile(file);
        setShowWaiver(true);
      } else if (result.canceled) {
        console.log('User canceled file selection');
      }
    } catch (error) {
      console.error('DocumentPicker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleAcceptWaiver = async () => {
    setShowWaiver(false);
    setShowSongDetails(true);
  };

  const handleSelectPoster = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPoster(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleConfirmUpload = async () => {
    // Validate inputs
    if (!songTitle.trim() || !artistName.trim()) {
      Alert.alert('Missing Information', 'Please enter both song title and artist name.');
      return;
    }

    setShowSongDetails(false);
    setUploading(true);

    try {
      let posterURL = null;

      // Upload poster image to Firebase Storage if selected, otherwise use default
      if (selectedPoster) {
        const posterUri = selectedPoster.uri;
        const posterFileName = `posters/${user.uid}_${Date.now()}_poster.jpg`;
        const posterStorageRef = ref(storage, posterFileName);
        
        const posterResponse = await fetch(posterUri);
        const posterBlob = await posterResponse.blob();
        await uploadBytes(posterStorageRef, posterBlob);
        posterURL = await getDownloadURL(posterStorageRef);
      } else {
        // Use default poster - will be handled by Image.resolveAssetSource or direct require
        posterURL = 'default';
      }

      // Upload audio file to Firebase Storage
      const fileUri = selectedFile.uri;
      const fileName = `songs/${user.uid}_${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, fileName);

      // Convert file to blob for upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Add song document to Firestore
      await addDoc(collection(db, 'songs'), {
        title: songTitle.trim(),
        artist: artistName.trim(),
        audioUrl: downloadURL,
        posterUrl: posterURL,
        uploadedBy: user.uid,
        uploaderName: user.displayName || user.email || 'Anonymous',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedAt: serverTimestamp(),
        plays: 0,
        likes: 0,
      });

      setUploading(false);
      Alert.alert('Success', 'Track uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setSelectedPoster(null);
      setSongTitle('');
      setArtistName('');
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload track. Please try again.');
    }
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

      {/* Song Details Modal */}
      <Modal
        visible={showSongDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSongDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Song Details</Text>
            
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formContainer}>
                {/* Poster Selection */}
                <Text style={styles.inputLabel}>Song Poster (Optional)</Text>
                <TouchableOpacity 
                  style={styles.posterSelector}
                  onPress={handleSelectPoster}
                >
                  {selectedPoster ? (
                    <Image 
                      source={{ uri: selectedPoster.uri }}
                      style={styles.posterImage}
                    />
                  ) : (
                    <View style={styles.posterPlaceholder}>
                      <Ionicons name="image-outline" size={48} color={COLORS.textMuted} />
                      <Text style={styles.posterPlaceholderText}>Tap to select poster</Text>
                      <Text style={styles.posterPlaceholderSubtext}>or use default image</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Song Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter song title"
                  placeholderTextColor={COLORS.textMuted}
                  value={songTitle}
                  onChangeText={setSongTitle}
                  autoCapitalize="words"
                />

                <Text style={styles.inputLabel}>Artist Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter artist name"
                  placeholderTextColor={COLORS.textMuted}
                  value={artistName}
                  onChangeText={setArtistName}
                  autoCapitalize="words"
                />

                {selectedFile && (
                  <View style={styles.fileInfoContainer}>
                    <Ionicons name="musical-note" size={20} color={COLORS.primary} />
                    <Text style={styles.fileInfoText} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowSongDetails(false);
                  setSongTitle('');
                  setArtistName('');
                  setSelectedPoster(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleConfirmUpload}
              >
                <Text style={styles.acceptButtonText}>Confirm Upload</Text>
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
  formScroll: {
    maxHeight: '70%',
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  posterSelector: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
    borderStyle: 'dashed',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  posterPlaceholderText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  posterPlaceholderSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  fileInfoText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});

export default UploadScreen;
