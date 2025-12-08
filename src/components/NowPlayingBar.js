import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

const NowPlayingBar = () => {
  const { 
    currentSong, 
    isPlaying, 
    volume, 
    position, 
    duration, 
    isBuffering,
    hasPlaylist,
    playPrevious,
    playNext,
    togglePlayPause, 
    stopSong, 
    changeVolume,
    seekToPosition,
    formatTime 
  } = useMusicPlayer();
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  // Log state for debugging
  console.log('NowPlayingBar render:', { 
    hasSong: !!currentSong, 
    isPlaying, 
    songTitle: currentSong?.title 
  });

  // Hide the banner if no song is currently loaded
  if (!currentSong) {
    return null;
  }

  const handleStop = () => {
    setShowVolumeControl(false); // Close volume control when stopping
    stopSong();
  };

  return (
    <View style={styles.container}>
      {/* Volume Slider */}
      {showVolumeControl && (
        <View style={styles.volumeSliderContainer}>
          <Ionicons name="volume-low" size={18} color={COLORS.text} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={changeVolume}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.surfaceLight}
            thumbTintColor={COLORS.primary}
          />
          <Ionicons name="volume-high" size={18} color={COLORS.text} />
        </View>
      )}

      {/* Now Playing Bar */}
      <View style={[
        styles.nowPlayingBar,
        isPlaying && styles.nowPlayingBarActive
      ]}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onSlidingComplete={seekToPosition}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.surfaceLight}
            thumbTintColor={COLORS.primary}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Song Info Row */}
        <View style={styles.infoRow}>
          <Image
            source={
              currentSong.posterUrl && currentSong.posterUrl !== 'default'
                ? { uri: currentSong.posterUrl }
                : require('../../assets/images/poster.png')
            }
            style={styles.songImage}
          />

          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>

          <View style={styles.controls}>
            {/* Volume Button */}
            <TouchableOpacity
              onPress={() => setShowVolumeControl(!showVolumeControl)}
              style={styles.controlButton}
            >
              <Ionicons
                name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
                size={22}
                color={COLORS.text}
              />
            </TouchableOpacity>

            {/* Previous Button - Only visible with playlist */}
            {hasPlaylist && (
              <TouchableOpacity
                onPress={playPrevious}
                style={styles.controlButton}
              >
                <Ionicons
                  name="play-skip-back"
                  size={22}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            )}

            {/* Play/Pause or Buffering Button */}
            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.controlButton}
              disabled={isBuffering}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color={COLORS.text}
                />
              )}
            </TouchableOpacity>

            {/* Next Button - Only visible with playlist */}
            {hasPlaylist && (
              <TouchableOpacity
                onPress={playNext}
                style={styles.controlButton}
              >
                <Ionicons
                  name="play-skip-forward"
                  size={22}
                  color={COLORS.text}
                />
              </TouchableOpacity>
            )}

            {/* Stop Button */}
            <TouchableOpacity
              onPress={handleStop}
              style={styles.controlButton}
            >
              <Ionicons name="stop" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Above bottom tab bar
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  volumeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  nowPlayingBar: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderTopWidth: 2,
    borderTopColor: COLORS.surfaceLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  nowPlayingBarActive: {
    borderTopColor: COLORS.primary, // Highlight border when playing
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  progressBar: {
    width: '100%',
    height: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: -SPACING.xs,
  },
  timeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songImage: {
    width: 45,
    height: 45,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  songInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  songTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
});

export default NowPlayingBar;
