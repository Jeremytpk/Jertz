import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { Asset } from 'expo-asset';

const { width, height } = Dimensions.get('window');

// Promo track data using local assets
const PROMO_TRACK = {
  id: 'promo-titina',
  title: 'Attends',
  artist: 'Titina',
  coverImage: require('../../assets/images/promos/titina.jpg'),
  audioFile: require('../../assets/images/promos/Attends.mp3'),
};

console.log('🎵 PROMO_TRACK defined:', PROMO_TRACK);
console.log('🎵 PROMO_TRACK.title:', PROMO_TRACK.title);
console.log('🎵 PROMO_TRACK.artist:', PROMO_TRACK.artist);

const PromoScreen = ({ visible, onClose }) => {
  const { playSong } = useMusicPlayer();

  console.log('🎵 PromoScreen rendered with visible:', visible);
  console.log('🎵 Displaying track:', PROMO_TRACK.title, 'by', PROMO_TRACK.artist);

  const handleListenNow = async () => {
    console.log('🎵 Listen Now clicked!');
    try {
      console.log('🎵 Loading audio from:', PROMO_TRACK.audioFile);
      
      // Load the audio asset to get the URI
      const audioAsset = Asset.fromModule(PROMO_TRACK.audioFile);
      await audioAsset.downloadAsync();
      
      // Create song object compatible with MusicPlayerContext
      const songData = {
        id: PROMO_TRACK.id,
        title: PROMO_TRACK.title,
        artist: PROMO_TRACK.artist,
        audioUrl: audioAsset.localUri || audioAsset.uri,
        coverUrl: null, // Using local image, not a URL
      };

      console.log('🎵 Song data prepared:', songData);
      
      // Play the song using MusicPlayerContext
      await playSong(songData);
      
      console.log('🎵 Song playing, closing promo...');
      onClose();
    } catch (error) {
      console.error('❌ Error playing promo track:', error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.promoContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={32} color={COLORS.text} />
          </TouchableOpacity>

          {/* Album Art / Cover */}
          <View style={styles.coverContainer}>
            <Image
              source={PROMO_TRACK.coverImage}
              style={styles.coverImage}
              resizeMode="cover"
              onLoad={() => console.log('🎵 Image loaded successfully')}
              onError={(e) => console.error('❌ Image load error:', e.nativeEvent.error)}
            />
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>
              {PROMO_TRACK.title}
            </Text>
            <Text style={styles.artistName}>
              {PROMO_TRACK.artist}
            </Text>
          </View>

          {/* Listen Now Button */}
          <TouchableOpacity
            style={styles.listenButton}
            onPress={handleListenNow}
          >
            <LinearGradient
              colors={GRADIENTS.primary}
              style={styles.listenButtonGradient}
            >
              <Ionicons name="play" size={24} color={COLORS.text} />
              <Text style={styles.listenButtonText}>Listen Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    padding: SPACING.sm,
  },
  coverContainer: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 250,
    maxHeight: 250,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  trackTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  artistName: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listenButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  listenButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  listenButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default PromoScreen;
