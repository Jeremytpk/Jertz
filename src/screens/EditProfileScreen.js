import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Missing Information', 'Please enter a display name.');
      return;
    }

    setSaving(true);

    try {
      let photoURL = user?.photoURL;

      // Upload profile photo if selected
      if (selectedPhoto) {
        const photoUri = selectedPhoto.uri;
        const photoFileName = `profiles/${user.uid}_profile.jpg`;
        const photoStorageRef = ref(storage, photoFileName);
        
        const photoResponse = await fetch(photoUri);
        const photoBlob = await photoResponse.blob();
        await uploadBytes(photoStorageRef, photoBlob);
        photoURL = await getDownloadURL(photoStorageRef);
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });

      // Update or create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL,
        email: user.email,
        updatedAt: new Date(),
      }, { merge: true });

      setSaving(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      setSaving(false);
      console.error('Profile update error:', error);
      Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handleSelectPhoto} style={styles.photoContainer}>
            <Image
              source={
                selectedPhoto
                  ? { uri: selectedPhoto.uri }
                  : user?.photoURL
                  ? { uri: user.photoURL }
                  : require('../../assets/images/profile.png')
              }
              style={styles.profilePhoto}
            />
            <View style={styles.photoEditBadge}>
              <Ionicons name="camera" size={20} color={COLORS.text} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>Tap to change profile photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={COLORS.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              placeholderTextColor={COLORS.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email}
              editable={false}
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
            {saving ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
  photoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  photoHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  form: {
    paddingHorizontal: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  disabledInput: {
    opacity: 0.5,
  },
  inputHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  saveButton: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default EditProfileScreen;
