import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { PROMOTED_SONG_DURATION } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, isGuest } = useAuth();
  const [showPromotedSong, setShowPromotedSong] = useState(true);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    // Auto-play promoted song fade-in/fade-out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setShowPromotedSong(false);
      });
    }, PROMOTED_SONG_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const dismissPromotedSong = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPromotedSong(false);
    });
  };

  const handleJoinRoom = () => {
    if (isGuest) {
      navigation.navigate('SignUp');
    } else {
      // Navigate to room
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          {user && !isGuest && (
            <Text style={styles.welcomeText}>Hi, {user.displayName || 'User'}!</Text>
          )}
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Promoted Song Overlay */}
      {showPromotedSong && (
        <Animated.View style={[styles.promotedOverlay, { opacity: fadeAnim }]}>
          <LinearGradient colors={GRADIENTS.dark} style={styles.promotedContent}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={dismissPromotedSong}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            
            <View style={styles.promotedInfo}>
              <Image
                source={{ uri: 'https://via.placeholder.com/200' }}
                style={styles.promotedImage}
              />
              <Text style={styles.promotedTitle}>Featured Track</Text>
              <Text style={styles.promotedArtist}>Artist Name</Text>
              <TouchableOpacity style={styles.promotedButton}>
                <Ionicons name="play" size={20} color={COLORS.text} />
                <Text style={styles.promotedButtonText}>Listen Now</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Room CTA */}
        <TouchableOpacity
          style={styles.createRoomCard}
          onPress={() => navigation.navigate('CreateRoom')}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.createRoomGradient}>
            <Ionicons name="add-circle" size={48} color={COLORS.text} />
            <Text style={styles.createRoomText}>Create a Room</Text>
            <Text style={styles.createRoomSubtext}>Start listening with friends</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Top 10 Charts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Top 10 Charts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TrackCard
                key={item}
                rank={item}
                onPress={handleJoinRoom}
              />
            ))}
          </ScrollView>
        </View>

        {/* Fresh Drops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✨ Fresh Drops</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TrackCard
                key={item}
                onPress={handleJoinRoom}
              />
            ))}
          </ScrollView>
        </View>

        {/* Active Rooms */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎧 Live Rooms</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {[1, 2, 3].map((item) => (
            <RoomCard
              key={item}
              onPress={handleJoinRoom}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const TrackCard = ({ rank, onPress }) => (
  <TouchableOpacity style={styles.trackCard} onPress={onPress}>
    <Image
      source={{ uri: 'https://via.placeholder.com/150' }}
      style={styles.trackImage}
    />
    {rank && (
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>
    )}
    <Text style={styles.trackTitle} numberOfLines={1}>Track Name</Text>
    <Text style={styles.trackArtist} numberOfLines={1}>Artist Name</Text>
    <View style={styles.trackStats}>
      <Ionicons name="play" size={14} color={COLORS.textSecondary} />
      <Text style={styles.trackStatsText}>1.2K plays</Text>
    </View>
  </TouchableOpacity>
);

const RoomCard = ({ onPress }) => (
  <TouchableOpacity style={styles.roomCard} onPress={onPress}>
    <Image
      source={{ uri: 'https://via.placeholder.com/80' }}
      style={styles.roomImage}
    />
    <View style={styles.roomInfo}>
      <Text style={styles.roomTitle} numberOfLines={1}>Chill Vibes Only 🎵</Text>
      <Text style={styles.roomHost} numberOfLines={1}>Hosted by @username</Text>
      <View style={styles.roomStats}>
        <Ionicons name="people" size={14} color={COLORS.primary} />
        <Text style={styles.roomStatsText}>12/50</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  welcomeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  promotedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  promotedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
  },
  dismissButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
  },
  promotedInfo: {
    alignItems: 'center',
  },
  promotedImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  promotedTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  promotedArtist: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  promotedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  promotedButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  createRoomCard: {
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  createRoomGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  createRoomText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  createRoomSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  trackCard: {
    width: 150,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },
  trackImage: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  rankBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  rankText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
  trackTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  trackArtist: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  trackStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackStatsText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  roomImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SPACING.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  roomHost: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomStatsText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    marginRight: SPACING.sm,
  },
  liveBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  liveText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
