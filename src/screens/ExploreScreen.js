import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { ROOM_MODES } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

const ExploreScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('rooms'); // rooms, tracks, users

  return (
    <View style={styles.container}>
      {/* Header with Search */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms, tracks, or users..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rooms' && styles.tabActive]}
          onPress={() => setActiveTab('rooms')}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>
            Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tracks' && styles.tabActive]}
          onPress={() => setActiveTab('tracks')}
        >
          <Text style={[styles.tabText, activeTab === 'tracks' && styles.tabTextActive]}>
            Tracks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'rooms' && <RoomsTab navigation={navigation} user={user} />}
        {activeTab === 'tracks' && <TracksTab />}
        {activeTab === 'users' && <UsersTab />}
      </ScrollView>
    </View>
  );
};

const RoomsTab = ({ navigation, user }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setRooms([]);
      setLoading(false);
      return;
    }

    const setupRoomsListener = async () => {
      try {
        // Get users that current user follows
        const followingQuery = query(
          collection(db, 'followers'),
          where('followerId', '==', user.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

        // Real-time listener for all live rooms
        const roomsQuery = query(
          collection(db, 'rooms'),
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

          setRooms(filteredRooms);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up rooms listener:', error);
        setLoading(false);
      }
    };

    let unsubscribe;
    setupRoomsListener().then(unsub => { unsubscribe = unsub; });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  const fetchRooms = async () => {
    if (!user?.uid) {
      setRooms([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Get users that current user follows
      const followingQuery = query(
        collection(db, 'followers'),
        where('followerId', '==', user.uid)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);

      const roomsQuery = query(
        collection(db, 'rooms'),
        where('isLive', '==', true)
      );
      
      const snapshot = await getDocs(roomsQuery);
      const allRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter rooms: user is participant OR host is followed by user
      const filteredRooms = allRooms.filter(room => 
        (room.participants && room.participants.includes(user.uid)) || 
        (room.hostId && followingIds.includes(room.hostId))
      );
      
      setRooms(filteredRooms);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRoomPress = (room) => {
    if (room.mode === ROOM_MODES.STANDARD) {
      navigation.navigate('ListeningRoom', { 
        roomId: room.id,
        roomData: room 
      });
    } else {
      navigation.navigate('ChallengeRoom', { 
        roomId: room.id,
        roomData: room 
      });
    }
  };

  return (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          fetchRooms();
        }} />
      }
    >
      {/* Create Room Button */}
      <TouchableOpacity 
        style={styles.createRoomButton}
        onPress={() => navigation.navigate('CreateRoom')}
      >
        <LinearGradient colors={GRADIENTS.primary} style={styles.createRoomGradient}>
          <Ionicons name="headset" size={24} color={COLORS.text} />
          <Text style={styles.createRoomText}>Create a Room</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.categoryTitle}>🔴 Live Now</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : rooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="headset-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No live rooms</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to create one!</Text>
        </View>
      ) : (
        rooms.map((room) => (
          <TouchableOpacity 
            key={room.id} 
            style={styles.roomCard}
            onPress={() => handleRoomPress(room)}
          >
            <Image
              source={
                room.hostPhoto
                  ? { uri: room.hostPhoto }
                  : require('../../assets/images/profile.png')
              }
              style={styles.roomImage}
            />
            {room.participants && room.participants.includes(user?.uid) && (
              <View style={styles.participantBadge}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
            )}
            <View style={styles.roomInfo}>
              <Text style={styles.roomTitle}>{room.name}</Text>
              <Text style={styles.roomHost}>Hosted by {room.hostName}</Text>
              <View style={styles.roomMeta}>
                <View style={styles.roomMetaItem}>
                  <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.roomMetaText}>
                    {room.participantCount || 1}/{room.capacity}
                  </Text>
                </View>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                {room.mode === ROOM_MODES.CHALLENGE && (
                  <View style={styles.challengeBadge}>
                    <Ionicons name="game-controller" size={12} color={COLORS.text} />
                    <Text style={styles.challengeText}>CHALLENGE</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const TracksTab = () => (
  <View style={styles.tabContent}>
    <Text style={styles.categoryTitle}>🎵 Popular Tracks</Text>
    {[1, 2, 3, 4, 5, 6].map((item) => (
      <View key={item} style={styles.trackCard}>
        <Image
          source={{ uri: 'https://via.placeholder.com/60' }}
          style={styles.trackImage}
        />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>Track Name Here</Text>
          <Text style={styles.trackArtist}>Artist Name</Text>
          <Text style={styles.trackStats}>1.2K plays • 234 rooms</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

const UsersTab = () => (
  <View style={styles.tabContent}>
    <Text style={styles.categoryTitle}>👥 Suggested Users</Text>
    {[1, 2, 3, 4, 5].map((item) => (
      <View key={item} style={styles.userCard}>
        <Image
          source={{ uri: 'https://via.placeholder.com/50' }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Username</Text>
          <Text style={styles.userBio}>Music lover | DJ | Creating vibes</Text>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

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
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.lg,
  },
  createRoomButton: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  createRoomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  createRoomText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  categoryTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    position: 'relative',
  },
  roomImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SPACING.md,
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
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  roomMetaText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
    gap: 2,
  },
  challengeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  trackImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SPACING.md,
  },
  trackInfo: {
    flex: 1,
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
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    marginRight: SPACING.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userBio: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  followButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
  },
});

export default ExploreScreen;
