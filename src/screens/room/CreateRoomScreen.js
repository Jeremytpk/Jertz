import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../../config/theme';
import { ROOM_MODES, MAX_ROOM_CAPACITY } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';

const CreateRoomScreen = ({ navigation, route }) => {
  const { user, isGuest } = useAuth();
  const { playSong } = useMusicPlayer();
  const { preSelectedSong, isChallenge } = route.params || {};
  const [roomName, setRoomName] = useState('');
  const [roomMode, setRoomMode] = useState(isChallenge ? ROOM_MODES.CHALLENGE : ROOM_MODES.STANDARD);
  const [capacity, setCapacity] = useState(25);
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Set initial room mode based on route params
    if (isChallenge !== undefined) {
      setRoomMode(isChallenge ? ROOM_MODES.CHALLENGE : ROOM_MODES.STANDARD);
    }
  }, [isChallenge]);

  const handleCreateRoom = async () => {
    // Check if user is in guest mode
    if (isGuest) {
      Alert.alert(
        'Sign In Required',
        'You need to create an account or sign in to create a room.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      setCreating(true);
      
      // Create room in Firebase
      const roomData = {
        name: roomName,
        mode: roomMode,
        capacity: capacity,
        isPrivate: isPrivate,
        hostId: user.uid,
        mainHostId: user.uid, // Original creator
        hostName: user.displayName || 'Anonymous',
        hostPhoto: user.photoURL || null,
        participants: [user.uid],
        participantCount: 1,
        currentSong: preSelectedSong || null,
        isLive: true,
        createdAt: serverTimestamp(),
      };

      const roomRef = await addDoc(collection(db, 'rooms'), roomData);
      
      setCreating(false);
      
      // Play the preselected song if available
      if (preSelectedSong) {
        playSong(preSelectedSong);
      }
      
      // Navigate to the appropriate room
      if (roomMode === ROOM_MODES.STANDARD) {
        navigation.replace('ListeningRoom', { 
          roomId: roomRef.id,
          roomData: { ...roomData, id: roomRef.id }
        });
      } else {
        navigation.replace('ChallengeRoom', { 
          roomId: roomRef.id,
          roomData: { ...roomData, id: roomRef.id }
        });
      }
    } catch (error) {
      setCreating(false);
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
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
        <Text style={styles.headerTitle}>Create Room</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Room Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Friday Night Vibes 🎵"
            placeholderTextColor={COLORS.textMuted}
            value={roomName}
            onChangeText={setRoomName}
          />
        </View>

        {/* Room Mode */}
        <View style={styles.section}>
          <Text style={styles.label}>Room Mode</Text>
          <View style={styles.modeCards}>
            <TouchableOpacity
              style={[
                styles.modeCard,
                roomMode === ROOM_MODES.STANDARD && styles.modeCardActive,
              ]}
              onPress={() => setRoomMode(ROOM_MODES.STANDARD)}
            >
              <Ionicons
                name="musical-notes"
                size={32}
                color={roomMode === ROOM_MODES.STANDARD ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[
                styles.modeTitle,
                roomMode === ROOM_MODES.STANDARD && styles.modeTitleActive,
              ]}>
                Standard
              </Text>
              <Text style={styles.modeDescription}>
                Focus on music & conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                roomMode === ROOM_MODES.CHALLENGE && styles.modeCardActive,
              ]}
              onPress={() => setRoomMode(ROOM_MODES.CHALLENGE)}
            >
              <Ionicons
                name="game-controller"
                size={32}
                color={roomMode === ROOM_MODES.CHALLENGE ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[
                styles.modeTitle,
                roomMode === ROOM_MODES.CHALLENGE && styles.modeTitleActive,
              ]}>
                Challenge
              </Text>
              <Text style={styles.modeDescription}>
                Gaming & image voting
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.label}>Maximum Capacity: {capacity}</Text>
          <View style={styles.capacityControls}>
            <TouchableOpacity
              style={styles.capacityButton}
              onPress={() => setCapacity(Math.max(2, capacity - 5))}
            >
              <Ionicons name="remove" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.capacityDisplay}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.capacityText}>{capacity}</Text>
            </View>
            <TouchableOpacity
              style={styles.capacityButton}
              onPress={() => setCapacity(Math.min(MAX_ROOM_CAPACITY, capacity + 5))}
            >
              <Ionicons name="add" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.privacyLeft}>
              <Ionicons
                name={isPrivate ? 'lock-closed' : 'globe'}
                size={24}
                color={COLORS.text}
              />
              <View style={styles.privacyText}>
                <Text style={styles.privacyTitle}>
                  {isPrivate ? 'Private Room' : 'Public Room'}
                </Text>
                <Text style={styles.privacyDescription}>
                  {isPrivate
                    ? 'Only people with link can join'
                    : 'Anyone can discover and join'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, isPrivate && styles.toggleActive]}>
              <View style={[styles.toggleThumb, isPrivate && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={handleCreateRoom}
          disabled={creating}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.createButtonGradient}>
            <Text style={styles.createButtonText}>
              {creating ? 'Creating Room...' : 'Create Room'}
            </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  modeCards: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modeCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardActive: {
    borderColor: COLORS.primary,
  },
  modeTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  modeTitleActive: {
    color: COLORS.primary,
  },
  modeDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  capacityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  capacityButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capacityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  capacityText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyText: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  privacyTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  privacyDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.text,
  },
  toggleThumbActive: {
    marginLeft: 22,
  },
  createButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.xl,
  },
  createButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default CreateRoomScreen;
