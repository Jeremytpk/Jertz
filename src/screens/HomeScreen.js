import React, { useState, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { PROMOTED_SONG_DURATION, ROOM_MODES } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import FeaturesScreen from './FeaturesScreen';

const { width } = Dimensions.get('window');

// Mock ad data with images
const ADS = [
  { 
    id: 1, 
    title: 'Premium: Ad-Free Listening!',
    subtitle: 'Enjoy unlimited music without interruptions',
    image: 'https://via.placeholder.com/120x80/E21F26/FFFFFF?text=Premium',
    color: GRADIENTS.primary 
  },
  { 
    id: 2, 
    title: 'New Album Drop - Check it out!',
    subtitle: 'The hottest tracks of the week',
    image: 'https://via.placeholder.com/120x80/D91F68/FFFFFF?text=Album',
    color: GRADIENTS.accent 
  },
  { 
    id: 3, 
    title: 'Join the biggest music community',
    subtitle: 'Connect with millions of music lovers',
    image: 'https://via.placeholder.com/120x80/7B2D8E/FFFFFF?text=Community',
    color: GRADIENTS.primaryReverse 
  },
  { 
    id: 4, 
    title: 'Unlimited Rooms with Premium',
    subtitle: 'Create and join unlimited listening rooms',
    image: 'https://via.placeholder.com/120x80/E21F26/FFFFFF?text=Rooms',
    color: GRADIENTS.primary 
  },
];

const HomeScreen = ({ navigation }) => {
  const { user, isGuest } = useAuth();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [liveRooms, setLiveRooms] = useState([]);
  const [freshDrops, setFreshDrops] = useState([]);
  const [showFeatures, setShowFeatures] = useState(false);
  const adTranslateX = useRef(new Animated.Value(0)).current;

  // Check if this is the first app launch (for Features tour)
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenFeatures = await AsyncStorage.getItem('hasSeenFeatures');
        console.log('🏠 HomeScreen: hasSeenFeatures =', hasSeenFeatures);
        if (!hasSeenFeatures) {
          console.log('🏠 First launch detected! Showing features...');
          setShowFeatures(true);
        } else {
          console.log('🏠 Not first launch, showing normal home screen');
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
      }
    };

    checkFirstLaunch();
  }, []);

  const handleFeaturesComplete = async () => {
    try {
      console.log('🏠 Features complete, saving to storage...');
      await AsyncStorage.setItem('hasSeenFeatures', 'true');
      setShowFeatures(false);
    } catch (error) {
      console.error('Error saving features completion:', error);
    }
  };

  // Fetch live rooms from Firebase - rooms user is participating in + rooms from followed users
  useEffect(() => {
    if (!user?.uid) return;

    const fetchRooms = async () => {
      try {
        // Get users that current user follows
        const followingQuery = query(
          collection(db, 'followers'),
          where('followerId', '==', user.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

        // Set up real-time listener for rooms
        const roomsRef = collection(db, 'rooms');
        const roomsQuery = query(
          roomsRef,
          where('isLive', '==', true)
        );

        const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
          const allRooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter rooms: user is participant OR host is followed by user
          const filteredRooms = allRooms.filter(room => 
            (room.participants && room.participants.includes(user.uid)) || 
            (room.hostId && followingIds.includes(room.hostId))
          );

          // Sort by participantCount in JavaScript and limit to 10
          const sortedRooms = filteredRooms.sort((a, b) => 
            (b.participantCount || 0) - (a.participantCount || 0)
          ).slice(0, 10);
          
          console.log('🏠 Live Rooms:', sortedRooms.map(r => ({ 
            name: r.name, 
            mode: r.mode,
            isChallenge: r.mode === ROOM_MODES.CHALLENGE
          })));
          setLiveRooms(sortedRooms);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up rooms listener:', error);
      }
    };

    let unsubscribe;
    fetchRooms().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  // Fetch Fresh Drops - songs uploaded in last 24 hours
  useEffect(() => {
    const fetchFreshDrops = async () => {
      try {
        // Calculate timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const songsRef = collection(db, 'songs');
        const freshDropsQuery = query(
          songsRef,
          where('uploadedAt', '>=', twentyFourHoursAgo),
          orderBy('uploadedAt', 'desc'),
          limit(10)
        );

        const unsubscribe = onSnapshot(freshDropsQuery, (snapshot) => {
          const songs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('🎵 Fresh Drops fetched:', songs.length);
          console.log('📸 Poster URLs:', songs.map(s => ({ 
            title: s.title, 
            posterUrl: s.posterUrl || 'MISSING',
            hasPoster: !!s.posterUrl 
          })));
          setFreshDrops(songs);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching fresh drops:', error);
      }
    };

    let unsubscribe;
    fetchFreshDrops().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Auto-sweep ads
    const adAnimation = () => {
      // Wait 4 seconds before starting the transition
      setTimeout(() => {
        Animated.timing(adTranslateX, {
          toValue: -width,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          adTranslateX.setValue(width);
          setCurrentAdIndex((prev) => (prev + 1) % ADS.length);
          Animated.timing(adTranslateX, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }).start(() => {
            adAnimation();
          });
        });
      }, 4000);
    };

    adAnimation();
  }, []);

  const handleJoinRoom = () => {
    if (isGuest) {
      navigation.navigate('SignUp');
    } else {
      // Navigate to room
    }
  };

  // Show features screen on first launch
  if (showFeatures) {
    return (
      <FeaturesScreen
        navigation={navigation}
        onComplete={handleFeaturesComplete}
      />
    );
  }

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
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreateRoom')}
          >
            <Ionicons name="headset-outline" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Ad Banner */}
      <View style={styles.adBanner}>
        <LinearGradient 
          colors={ADS[currentAdIndex].color} 
          style={styles.adGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Animated.View 
            style={[
              styles.adContent,
              { transform: [{ translateX: adTranslateX }] }
            ]}
          >
            <Image 
              source={{ uri: ADS[currentAdIndex].image }}
              style={styles.adImage}
              resizeMode="cover"
            />
            <View style={styles.adTextContainer}>
              <Text style={styles.adTitle} numberOfLines={1}>
                {ADS[currentAdIndex].title}
              </Text>
              <Text style={styles.adSubtitle} numberOfLines={1}>
                {ADS[currentAdIndex].subtitle}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
            {freshDrops.length > 0 ? (
              freshDrops.map((song) => (
                <TrackCard
                  key={song.id}
                  song={song}
                  onPress={handleJoinRoom}
                />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>No fresh drops yet</Text>
              </View>
            )}
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
          {liveRooms.length > 0 ? (
            liveRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isParticipant={room.participants && room.participants.includes(user?.uid)}
                onPress={() => {
                  if (isGuest) {
                    navigation.navigate('SignUp');
                  } else {
                    // Determine room type and navigate
                    navigation.navigate(room.type === 'challenge' ? 'ChallengeRoom' : 'ListeningRoom', {
                      roomId: room.id
                    });
                  }
                }}
              />
            ))
          ) : (
            <View style={styles.emptyRooms}>
              <Ionicons name="musical-notes-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyRoomsText}>No live rooms right now</Text>
              <Text style={styles.emptyRoomsSubtext}>Be the first to create one!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const TrackCard = ({ rank, song, onPress }) => {
  // Check if posterUrl is valid (not empty, not "default" string, and not undefined)
  const hasValidPosterUrl = song?.posterUrl && 
                            song.posterUrl.trim() !== '' && 
                            song.posterUrl !== 'default' &&
                            song.posterUrl.startsWith('http');
  
  return (
    <TouchableOpacity style={styles.trackCard} onPress={onPress}>
      <View style={styles.trackImageContainer}>
        {hasValidPosterUrl ? (
          <Image
            source={{ uri: song.posterUrl }}
            style={styles.trackImage}
            defaultSource={require('../../assets/images/poster.png')}
            onError={(e) => console.log('Image load error:', song.title, e.nativeEvent.error)}
          />
        ) : (
          <Image
            source={require('../../assets/images/poster.png')}
            style={styles.trackImage}
          />
        )}
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}
      {/* Gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.trackGradientOverlay}
      >
        <Text style={styles.trackTitle} numberOfLines={1}>
          {song?.title || 'Track Name'}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {song?.artist || 'Artist Name'}
        </Text>
      </LinearGradient>
    </View>
    
    {/* Uploader info */}
    <Text style={styles.uploaderName} numberOfLines={1}>@
       {song?.uploaderName || 'Unknown User'}
    </Text>
    
    {/* Play count */}
    <View style={styles.trackStats}>
      <Ionicons name="play" size={14} color={COLORS.textSecondary} />
      <Text style={styles.trackStatsText}>
        {song?.playCount ? `${song.playCount >= 1000 ? (song.playCount / 1000).toFixed(1) + 'K' : song.playCount} plays` : '0 plays'}
      </Text>
    </View>
  </TouchableOpacity>
  );
};

const RoomCard = ({ room, onPress, isParticipant }) => {
  // Priority: host profile photo > current song cover > playlist first song cover
  const imageUrl = room?.hostProfilePhoto || room?.currentSong?.coverUrl || room?.playlist?.[0]?.coverUrl;
  
  // Debug: Log room mode
  console.log(`🎯 Room "${room?.name}" - mode: "${room?.mode}" - isChallenge: ${room?.mode === ROOM_MODES.CHALLENGE}`);
  
  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.roomImage}
          defaultSource={require('../../assets/images/logo.png')}
        />
      ) : (
        <View style={[styles.roomImage, styles.roomImagePlaceholder]}>
          <Ionicons name="musical-notes" size={28} color={COLORS.textMuted} />
        </View>
      )}
      {isParticipant && (
        <View style={styles.participantBadge}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </View>
      )}
      <View style={styles.roomInfo}>
        <Text style={styles.roomTitle} numberOfLines={1}>{room?.name || 'Untitled Room'}</Text>
        <Text style={styles.roomHost} numberOfLines={1}>Hosted by {room?.hostName || 'Anonymous'}</Text>
        <View style={styles.roomStats}>
          <Ionicons name="people" size={14} color={COLORS.primary} />
          <Text style={styles.roomStatsText}>{room?.participantCount || 0}/50</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          {room?.mode === ROOM_MODES.CHALLENGE && (
            <View style={styles.challengeBadge}>
              <Ionicons name="game-controller" size={10} color={COLORS.text} />
              <Text style={styles.challengeText}>CHALLENGE</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
};

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  adBanner: {
    height: 80,
    width: "95%",
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 15,
    marginTop: 25,
    backgroundColor: COLORS.surface,
    borderRadius: 15,
  },
  adGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  adContent: {
    width: width - (SPACING.lg * 2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  adImage: {
    width: 120,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  adTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  adTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  adSubtitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '500',
    color: COLORS.text,
    opacity: 0.85,
  },
  content: {
    flex: 1,
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
  trackImageContainer: {
    width: 150,
    height: 150,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  trackImage: {
    width: '100%',
    height: '100%',
  },
  trackGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  trackImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
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
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    opacity: 0.9,
  },
  uploaderName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '500',
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
    position: 'relative',
  },
  roomImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SPACING.md,
  },
  roomImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  participantBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 2,
    zIndex: 1,
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
  challengeBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  challengeText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  emptyRooms: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    marginHorizontal: SPACING.lg,
  },
  emptyRoomsText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyRoomsSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  emptySection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  emptySectionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
  },
});

export default HomeScreen;
