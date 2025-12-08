import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

const MyUploadsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, setPlaylistAndPlay } = useMusicPlayer();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [userRooms, setUserRooms] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editPoster, setEditPoster] = useState(null);

  useEffect(() => {
    fetchUserSongs();
  }, []);

  const fetchUserSongs = async () => {
    try {
      setLoading(true);
      const songsQuery = query(
        collection(db, 'songs'),
        where('uploadedBy', '==', user.uid)
      );
      
      const snapshot = await getDocs(songsQuery);
      let songsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by uploadedAt on the client side
      songsData.sort((a, b) => {
        const timeA = a.uploadedAt?.toDate?.() || new Date(0);
        const timeB = b.uploadedAt?.toDate?.() || new Date(0);
        return timeB - timeA; // Descending order (newest first)
      });
      
      setSongs(songsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load your uploads');
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const playlistsQuery = query(
        collection(db, 'playlists'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(playlistsQuery);
      const playlistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const handleMorePress = (song) => {
    setSelectedSong(song);
    setShowOptionsModal(true);
  };

  const handleAddToPlaylist = async () => {
    setShowOptionsModal(false);
    await fetchUserPlaylists();
    setShowPlaylistModal(true);
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      await addDoc(collection(db, 'playlists'), {
        name: newPlaylistName,
        userId: user.uid,
        songs: [selectedSong.id],
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Playlist created and song added!');
      setNewPlaylistName('');
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handleAddToExistingPlaylist = async (playlistId) => {
    try {
      const playlistRef = doc(db, 'playlists', playlistId);
      await updateDoc(playlistRef, {
        songs: arrayUnion(selectedSong.id),
      });
      Alert.alert('Success', 'Song added to playlist!');
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error adding to playlist:', error);
      Alert.alert('Error', 'Failed to add song to playlist');
    }
  };

  const fetchUserRooms = async () => {
    try {
      // Fetch rooms where user is a participant
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('participants', 'array-contains', user.uid),
        where('isLive', '==', true)
      );
      const snapshot = await getDocs(roomsQuery);
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleAddToRoom = async () => {
    setShowOptionsModal(false);
    await fetchUserRooms();
    setShowRoomsModal(true);
  };

  const handleAddToExistingRoom = async (roomId, roomName) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const currentPlaylist = roomData.playlist || [];
        
        // Check if playlist is full (max 5 songs)
        if (currentPlaylist.length >= 5) {
          Alert.alert('Playlist Full', 'This room already has 5 songs in the playlist. Remove a song to add a new one.');
          return;
        }
        
        // Check if song is already in playlist
        if (currentPlaylist.some(song => song.id === selectedSong.id)) {
          Alert.alert('Already Added', 'This song is already in the room playlist.');
          return;
        }
        
        // Add song to room playlist
        await updateDoc(roomRef, {
          playlist: arrayUnion({
            id: selectedSong.id,
            title: selectedSong.title || 'Untitled',
            artist: selectedSong.artist || 'Unknown Artist',
            coverUrl: selectedSong.posterUrl && selectedSong.posterUrl !== 'default' 
              ? selectedSong.posterUrl 
              : null,
            audioUrl: selectedSong.audioUrl || '',
          }),
        });
        
        Alert.alert('Success', `Song added to ${roomName}!`);
        setShowRoomsModal(false);
      }
    } catch (error) {
      console.error('Error adding to room:', error);
      Alert.alert('Error', 'Failed to add song to room');
    }
  };

  const handleCreateRoom = (isChallenge) => {
    setShowRoomsModal(false);
    navigation.navigate('CreateRoom', { 
      preSelectedSong: selectedSong,
      isChallenge 
    });
  };

  const handleEditSong = () => {
    setEditTitle(selectedSong.title);
    setEditArtist(selectedSong.artist);
    setEditPoster(selectedSong.posterUrl);
    setShowOptionsModal(false);
    setShowEditModal(true);
  };

  const handlePickPoster = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setEditPoster(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editArtist.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const songRef = doc(db, 'songs', selectedSong.id);
      let posterUrl = selectedSong.posterUrl;

      // Upload new poster if changed
      if (editPoster && editPoster !== selectedSong.posterUrl) {
        const response = await fetch(editPoster);
        const blob = await response.blob();
        const posterRef = ref(storage, `posters/${user.uid}/${Date.now()}.jpg`);
        await uploadBytes(posterRef, blob);
        posterUrl = await getDownloadURL(posterRef);
      }

      await updateDoc(songRef, {
        title: editTitle,
        artist: editArtist,
        posterUrl: posterUrl,
      });

      Alert.alert('Success', 'Song updated successfully!');
      setShowEditModal(false);
      fetchUserSongs(); // Refresh the list
    } catch (error) {
      console.error('Error updating song:', error);
      Alert.alert('Error', 'Failed to update song');
    }
  };

  const handleDeleteSong = () => {
    setShowOptionsModal(false);
    Alert.alert(
      'Delete Song',
      'Are you sure you want to delete this song? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from Firestore
              await deleteDoc(doc(db, 'songs', selectedSong.id));

              // Delete audio file from Storage
              if (selectedSong.audioUrl) {
                const audioRef = ref(storage, selectedSong.audioUrl);
                await deleteObject(audioRef).catch(() => {});
              }

              // Delete poster from Storage if not default
              if (selectedSong.posterUrl && selectedSong.posterUrl !== 'default') {
                const posterRef = ref(storage, selectedSong.posterUrl);
                await deleteObject(posterRef).catch(() => {});
              }

              Alert.alert('Success', 'Song deleted successfully');
              fetchUserSongs(); // Refresh the list
            } catch (error) {
              console.error('Error deleting song:', error);
              Alert.alert('Error', 'Failed to delete song');
            }
          },
        },
      ]
    );
  };

  const renderSongItem = ({ item, index }) => {
    const isCurrentlyPlaying = currentSong?.id === item.id;

    const handlePress = () => {
      // Set the entire songs list as playlist and play the tapped song
      setPlaylistAndPlay(songs, index);
    };

    return (
      <TouchableOpacity
        style={[
          styles.songCard,
          isCurrentlyPlaying && styles.songCardPlaying
        ]}
        onPress={handlePress}
      >
        <Image
          source={
            item.posterUrl && item.posterUrl !== 'default'
              ? { uri: item.posterUrl }
              : require('../../assets/images/poster.png')
          }
          style={styles.songImage}
        />
        
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
          <View style={styles.songStats}>
            <Ionicons name="play" size={14} color={COLORS.textSecondary} />
            <Text style={styles.songStatsText}>{item.plays || 0} plays</Text>
            <Ionicons name="heart" size={14} color={COLORS.textSecondary} style={styles.statIcon} />
            <Text style={styles.songStatsText}>{item.likes || 0} likes</Text>
          </View>
        </View>

        <View style={styles.playButton}>
          {isCurrentlyPlaying ? (
            isPlaying ? (
              <Ionicons name="pause-circle" size={48} color={COLORS.primary} />
            ) : (
              <Ionicons name="play-circle" size={48} color={COLORS.primary} />
            )
          ) : (
            <Ionicons name="play-circle" size={48} color={COLORS.primary} />
          )}
        </View>

        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => handleMorePress(item)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Uploads</Text>
          <View style={styles.headerRight} />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Uploads</Text>
        
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Songs List */}
      {songs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyStateText}>No uploads yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Upload your first track to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Song Options</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.optionItem} onPress={handleAddToPlaylist}>
              <Ionicons name="list" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={handleAddToRoom}>
              <Ionicons name="headset" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Add to Room</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={handleEditSong}>
              <Ionicons name="pencil" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Edit Song Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={handleDeleteSong}>
              <Ionicons name="trash" size={24} color={COLORS.error} />
              <Text style={[styles.optionText, { color: COLORS.error }]}>Delete Song</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Playlist Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.playlistModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Playlist</Text>
              <TouchableOpacity onPress={() => setShowPlaylistModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.playlistList}>
              {/* Create New Playlist */}
              <View style={styles.createPlaylistSection}>
                <Text style={styles.sectionLabel}>Create New Playlist</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Playlist name"
                    placeholderTextColor={COLORS.textMuted}
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                  />
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={handleCreateNewPlaylist}
                  >
                    <Ionicons name="add" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Existing Playlists */}
              {playlists.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Your Playlists</Text>
                  {playlists.map((playlist) => (
                    <TouchableOpacity
                      key={playlist.id}
                      style={styles.playlistItem}
                      onPress={() => handleAddToExistingPlaylist(playlist.id)}
                    >
                      <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
                      <Text style={styles.playlistName}>{playlist.name}</Text>
                      <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rooms Modal */}
      <Modal
        visible={showRoomsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoomsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.playlistModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Room</Text>
              <TouchableOpacity onPress={() => setShowRoomsModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.playlistList}>
              {/* Create New Room Section */}
              <View style={styles.createPlaylistSection}>
                <Text style={styles.sectionLabel}>Create New Room</Text>
                
                <TouchableOpacity 
                  style={styles.optionItem} 
                  onPress={() => handleCreateRoom(false)}
                >
                  <Ionicons name="headset-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.optionText}>Standard Room</Text>
                  <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.optionItem} 
                  onPress={() => handleCreateRoom(true)}
                >
                  <Ionicons name="trophy-outline" size={24} color={COLORS.accent} />
                  <Text style={styles.optionText}>Challenge Room</Text>
                  <Ionicons name="add-circle-outline" size={24} color={COLORS.accent} />
                </TouchableOpacity>
              </View>

              {/* Existing Active Rooms */}
              {userRooms.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Your Active Rooms</Text>
                  {userRooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={styles.playlistItem}
                      onPress={() => handleAddToExistingRoom(room.id, room.name)}
                    >
                      <Ionicons 
                        name={room.type === 'challenge' ? 'trophy' : 'headset'} 
                        size={24} 
                        color={COLORS.primary} 
                      />
                      <View style={styles.roomItemInfo}>
                        <Text style={styles.playlistName}>{room.name}</Text>
                        <Text style={styles.roomItemSubtext}>
                          {room.playlist?.length || 0}/5 songs • {room.participantCount || 0} listening
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
              
              {userRooms.length === 0 && (
                <View style={styles.emptyRooms}>
                  <Ionicons name="headset-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyRoomsText}>No active rooms</Text>
                  <Text style={styles.emptyRoomsSubtext}>Create a new room to add this song</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Song Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Song</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editForm}>
              {/* Poster */}
              <TouchableOpacity style={styles.posterPicker} onPress={handlePickPoster}>
                <Image
                  source={
                    editPoster && editPoster !== 'default'
                      ? { uri: editPoster }
                      : require('../../assets/images/poster.png')
                  }
                  style={styles.editPosterImage}
                />
                <View style={styles.posterOverlay}>
                  <Ionicons name="camera" size={32} color={COLORS.text} />
                  <Text style={styles.posterOverlayText}>Change Poster</Text>
                </View>
              </TouchableOpacity>

              {/* Title */}
              <Text style={styles.label}>Song Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter song title"
                placeholderTextColor={COLORS.textMuted}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              {/* Artist */}
              <Text style={styles.label}>Artist Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter artist name"
                placeholderTextColor={COLORS.textMuted}
                value={editArtist}
                onChangeText={setEditArtist}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.saveButtonGradient}>
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.lg,
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  songCardPlaying: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  songImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  songInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  songTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  songArtist: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  songStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songStatsText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  statIcon: {
    marginLeft: SPACING.md,
  },
  playButton: {
    marginLeft: SPACING.sm,
  },
  moreButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  optionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
  },
  playlistModal: {
    maxHeight: '80%',
  },
  playlistList: {
    maxHeight: 400,
  },
  createPlaylistSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  playlistName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
    flex: 1,
  },
  editModal: {
    maxHeight: '90%',
  },
  editForm: {
    maxHeight: 500,
  },
  posterPicker: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  editPosterImage: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterOverlayText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  roomItemSubtext: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyRooms: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyRoomsText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyRoomsSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default MyUploadsScreen;
