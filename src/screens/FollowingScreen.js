import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';

const FollowingScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFollowing();
  }, [user?.uid]);

  // Refresh when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchFollowing();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchFollowing = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);

      // Get all users the current user is following
      const followersRef = collection(db, 'followers');
      const q = query(
        followersRef,
        where('followerId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);

      const followingList = [];
      
      // Fetch details for each followed user
      for (const docSnap of querySnapshot.docs) {
        const followData = docSnap.data();
        try {
          const userRef = doc(db, 'users', followData.followingId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            followingList.push({
              id: docSnap.id, // follower document ID for unfollowing
              userId: followData.followingId,
              displayName: userDoc.data().displayName || 'User',
              email: userDoc.data().email || '',
              photoURL: userDoc.data().photoURL || null,
              bio: userDoc.data().bio || '',
              followedAt: followData.createdAt,
            });
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      // Sort by most recently followed
      followingList.sort((a, b) => {
        if (!a.followedAt || !b.followedAt) return 0;
        return b.followedAt.seconds - a.followedAt.seconds;
      });

      setFollowing(followingList);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching following:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUnfollow = (followingUser) => {
    Alert.alert(
      'Unfollow',
      `Are you sure you want to unfollow ${followingUser.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'followers', followingUser.id));
              // Remove from local state
              setFollowing(prev => prev.filter(f => f.id !== followingUser.id));
            } catch (error) {
              console.error('Error unfollowing user:', error);
              Alert.alert('Error', 'Failed to unfollow user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFollowing();
  };

  const renderFollowingItem = ({ item }) => (
    <View style={styles.followingItem}>
      <TouchableOpacity 
        style={styles.followingItemContent}
        onPress={() => {
          // Navigate to user profile (you can implement this later)
          // navigation.navigate('UserProfile', { userId: item.userId });
        }}
      >
        <Image
          source={
            item.photoURL
              ? { uri: item.photoURL }
              : require('../../assets/images/profile.png')
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{item.displayName}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : (
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.unfollowButton}
        onPress={() => handleUnfollow(item)}
      >
        <Text style={styles.unfollowButtonText}>Following</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Following</Text>
          <View style={styles.backButton} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      {/* Following List */}
      {following.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Not Following Anyone</Text>
          <Text style={styles.emptySubtext}>
            Start following artists and creators to see their latest content
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Explore')}
          >
            <Text style={styles.exploreButtonText}>Explore</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={following}
          keyExtractor={(item) => item.id}
          renderItem={renderFollowingItem}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.md,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  followingItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  displayName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  bio: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  email: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
  },
  unfollowButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  unfollowButtonText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  separator: {
    height: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  exploreButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default FollowingScreen;
