import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { user, isGuest, signOut } = useAuth();
  const [uploadCount, setUploadCount] = useState(0);
  const [roomCount, setRoomCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [liveRoomCount, setLiveRoomCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest && user) {
      // Reset counts before fetching
      setUploadCount(0);
      setRoomCount(0);
      setFollowerCount(0);
      setLiveRoomCount(0);
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user, isGuest]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!isGuest && user) {
        // Reset counts before fetching
        setUploadCount(0);
        setRoomCount(0);
        setFollowerCount(0);
        setLiveRoomCount(0);
        fetchUserStats();
      }
    });

    return unsubscribe;
  }, [navigation, user, isGuest]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }

      // Fetch upload count
      const songsQuery = query(
        collection(db, 'songs'),
        where('uploadedBy', '==', user.uid)
      );
      const songsSnapshot = await getDocs(songsQuery);
      console.log('Songs found:', songsSnapshot.size);
      console.log('User UID:', user.uid);
      console.log('Songs data:', songsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUploadCount(songsSnapshot.size);

      // Fetch room count
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('createdBy', '==', user.uid)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      console.log('Rooms found:', roomsSnapshot.size);
      setRoomCount(roomsSnapshot.size);

      // Fetch follower count (if followers collection exists)
      const followersQuery = query(
        collection(db, 'followers'),
        where('followingId', '==', user.uid)
      );
      const followersSnapshot = await getDocs(followersQuery);
      console.log('Followers found:', followersSnapshot.size);
      setFollowerCount(followersSnapshot.size);

      // Fetch live room count
      const liveRoomsQuery = query(
        collection(db, 'rooms'),
        where('hostId', '==', user.uid),
        where('isLive', '==', true)
      );
      const liveRoomsSnapshot = await getDocs(liveRoomsQuery);
      console.log('Live Rooms found:', liveRoomsSnapshot.size);
      setLiveRoomCount(liveRoomsSnapshot.size);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (isGuest) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.guestHeader}>
          <Ionicons name="person-circle-outline" size={100} color={COLORS.text} />
          <Text style={styles.guestTitle}>You're in Guest Mode</Text>
          <Text style={styles.guestSubtext}>
            Sign up to upload tracks, create rooms, and more!
          </Text>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="create-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : user?.photoURL
                ? { uri: user.photoURL }
                : require('../../assets/images/profile.png')
            }
            style={styles.avatar}
          />
          <Text style={styles.displayName}>
            {userProfile?.displayName || user?.displayName || 'User'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {userProfile?.bio && (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          )}

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{uploadCount}</Text>
              <Text style={styles.statLabel}>Uploads</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{liveRoomCount}</Text>
              <Text style={styles.statLabel}>Rooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <MenuOption
            icon="musical-notes-outline"
            title="My Uploads"
            onPress={() => navigation.navigate('MyUploads')}
          />
          <MenuOption
            icon="time-outline"
            title="Listening History"
            onPress={() => {}}
          />
          <MenuOption
            icon="heart-outline"
            title="Favorites"
            onPress={() => {}}
          />
          <MenuOption
            icon="people-outline"
            title="Following"
            onPress={() => navigation.navigate('Following')}
          />
          <MenuOption
            icon="notifications-outline"
            title="Notifications"
            onPress={() => {}}
          />
          <MenuOption
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            onPress={() => {}}
          />
          <MenuOption
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
          />
          <MenuOption
            icon="information-circle-outline"
            title="About Jertz"
            onPress={() => {}}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const MenuOption = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuOption} onPress={onPress}>
    <View style={styles.menuOptionLeft}>
      <Ionicons name={icon} size={24} color={COLORS.text} />
      <Text style={styles.menuOptionText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },
  guestHeader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  guestTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  guestSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: SPACING.xxl,
  },
  signUpButton: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  signUpButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  signInText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    textDecorationLine: 'underline',
  },
  header: {
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'flex-end',
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  displayName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  bio: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  statNumber: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.surfaceLight,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  editProfileText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.lg,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  menuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOptionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  signOutText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  version: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingBottom: SPACING.xl,
  },
});

export default ProfileScreen;
