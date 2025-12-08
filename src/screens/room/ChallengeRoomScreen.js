import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc, onSnapshot, deleteDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../../config/theme';
import { CHALLENGE_IMAGE_SIZE } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';

const { width } = Dimensions.get('window');

const ChallengeRoomScreen = ({ navigation, route }) => {
  const { roomId } = route.params || {};
  const { user } = useAuth();
  const { 
    currentSong, 
    isPlaying, 
    position, 
    duration, 
    isBuffering,
    sound,
    togglePlayPause,
    seekToPosition,
    formatTime,
    playSong,
    setPlaylistAndPlay,
    setSound,
    setCurrentSong,
    setIsPlaying,
    setPosition,
    setDuration,
    setIsBuffering
  } = useMusicPlayer();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [lastTap, setLastTap] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [roomData, setRoomData] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [participantDetails, setParticipantDetails] = useState({});
  const [showParticipants, setShowParticipants] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Use refs for values that shouldn't trigger re-renders
  const lastSeekTimestampRef = useRef(0);
  const prevRoomDataRef = useRef(null);

  // Listen to room data changes
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const newParticipants = data.participants || [];
        const prevData = prevRoomDataRef.current;
        
        // Check if only reactions changed (to prevent playback interruption)
        const onlyReactionsChanged = prevData && 
          data.isPlaying === prevData.isPlaying &&
          data.seekPosition === prevData.seekPosition &&
          data.seekTimestamp === prevData.seekTimestamp &&
          data.currentSong?.id === prevData.currentSong?.id;
        
        // Update previous data ref
        prevRoomDataRef.current = data;
        
        // Check if user has been kicked out
        if (user?.uid && !newParticipants.includes(user.uid)) {
          Alert.alert(
            'Kicked Out',
            `You have been removed from ${data.name || 'the room'}.`,
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Home')
              }
            ],
            { cancelable: false }
          );
          return;
        }
        
        setRoomData({ id: snapshot.id, ...data });
        setParticipants(newParticipants);
        
        // Load playlist (limited to 5 songs)
        if (data.playlist && Array.isArray(data.playlist)) {
          const limitedPlaylist = data.playlist.slice(0, 5);
          setPlaylist(limitedPlaylist);
          
          // Sync playback for all users (skip if only reactions changed)
          if (data.currentSong && !onlyReactionsChanged) {
            try {
              const isHost = data.hostId === user?.uid; // Use data.hostId, not roomData.hostId
              
              // If different song, load it
              if (!currentSong || currentSong.id !== data.currentSong.id) {
                const songRef = doc(db, 'songs', data.currentSong.id);
                const songDoc = await getDoc(songRef);
                if (songDoc.exists()) {
                  const songData = { id: songDoc.id, ...songDoc.data() };
                  
                  // For participants: load song but don't auto-play
                  if (!isHost) {
                    // Unload current sound if exists
                    if (sound) {
                      try {
                        await sound.unloadAsync();
                      } catch (e) {
                        console.log('Error unloading sound:', e);
                      }
                    }
                    
                    // Create playback status update callback
                    const onPlaybackStatusUpdate = (status) => {
                      if (status.isLoaded) {
                        setPosition(status.positionMillis);
                        setDuration(status.durationMillis);
                        setIsPlaying(status.isPlaying);
                        setIsBuffering(status.isBuffering);
                      }
                    };
                    
                    // Load new song without auto-play
                    const { sound: newSound } = await Audio.Sound.createAsync(
                      { uri: songData.audioUrl },
                      { shouldPlay: false, volume: 1.0 },
                      onPlaybackStatusUpdate
                    );
                    
                    // Ensure callback is set
                    newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
                    
                    setSound(newSound);
                    setCurrentSong(songData);
                    setIsPlaying(false);
                    
                    // Calculate current position (if host is playing, account for elapsed time)
                    let syncPosition = data.seekPosition || 0;
                    if (data.isPlaying && data.seekTimestamp) {
                      const elapsedTime = Date.now() - data.seekTimestamp;
                      syncPosition = Math.min(syncPosition + elapsedTime, data.duration || syncPosition + elapsedTime);
                    }
                    
                    await newSound.setPositionAsync(syncPosition);
                    setPosition(syncPosition); // Update UI position immediately
                    
                    // Now check if host is playing and play accordingly
                    if (data.isPlaying) {
                      await newSound.playAsync();
                      setIsPlaying(true);
                    }
                  } else {
                    // Host can play normally
                    await playSong(songData);
                  }
                }
              }
              
              // Sync play/pause state for participants (not host)
              if (!isHost && sound) {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                  if (data.isPlaying && !status.isPlaying) {
                    await sound.playAsync();
                    setIsPlaying(true); // Update UI state
                  } else if (!data.isPlaying && status.isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false); // Update UI state
                  }
                  
                  // Sync seek position if host has updated it
                  if (data.seekTimestamp && data.seekTimestamp > lastSeekTimestampRef.current) {
                    await sound.setPositionAsync(data.seekPosition);
                    lastSeekTimestampRef.current = data.seekTimestamp;
                  }
                }
              }
            } catch (error) {
              console.error('Error syncing playback:', error);
            }
          }
        }
      } else {
        // Room deleted, navigate back
        Alert.alert('Room Ended', 'This room has been ended by the host.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
      }
    });

    return () => unsubscribe();
  }, [roomId, user?.uid]);

  // Fetch participant details from users collection
  useEffect(() => {
    const fetchParticipantDetails = async () => {
      if (participants.length === 0) return;

      const details = {};
      
      for (const participantId of participants) {
        try {
          const userRef = doc(db, 'users', participantId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            details[participantId] = {
              displayName: userDoc.data().displayName,
              email: userDoc.data().email,
              photoURL: userDoc.data().photoURL,
            };
          } else {
            details[participantId] = {
              displayName: `User ${participantId.slice(0, 6)}`,
              email: null,
              photoURL: null,
            };
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          details[participantId] = {
            displayName: `User ${participantId.slice(0, 6)}`,
            email: null,
            photoURL: null,
          };
        }
      }
      
      setParticipantDetails(details);
    };

    fetchParticipantDetails();
  }, [participants]);

  useEffect(() => {
    // Check if user has liked the current song
    if (currentSong?.id && user?.uid) {
      checkIfLiked();
    }
  }, [currentSong?.id, user?.uid]);

  useEffect(() => {
    // Check if user is following the host
    if (roomData?.hostId && user?.uid && roomData.hostId !== user.uid) {
      checkIfFollowing();
    }
  }, [roomData?.hostId, user?.uid]);

  const checkIfLiked = async () => {
    if (!currentSong?.id || !user?.uid) return;
    
    try {
      const songRef = doc(db, 'songs', currentSong.id);
      const songDoc = await getDoc(songRef);
      
      if (songDoc.exists()) {
        const songData = songDoc.data();
        const likedBy = songData.likedBy || [];
        setIsLiked(likedBy.includes(user.uid));
        setLikeCount(songData.likes || 0);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!currentSong?.id || !user?.uid) return;

    try {
      const songRef = doc(db, 'songs', currentSong.id);
      
      if (isLiked) {
        // Unlike
        await updateDoc(songRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await updateDoc(songRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const checkIfFollowing = async () => {
    if (!roomData?.hostId || !user?.uid || roomData.hostId === user.uid) return;
    
    try {
      const followersRef = collection(db, 'followers');
      const q = query(
        followersRef, 
        where('followerId', '==', user.uid),
        where('followingId', '==', roomData.hostId)
      );
      const querySnapshot = await getDocs(q);
      setIsFollowing(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!roomData?.hostId || !user?.uid || roomData.hostId === user.uid) return;

    try {
      const followersRef = collection(db, 'followers');
      
      if (isFollowing) {
        // Unfollow
        const q = query(
          followersRef,
          where('followerId', '==', user.uid),
          where('followingId', '==', roomData.hostId)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'followers', docSnap.id));
        });
        setIsFollowing(false);
      } else {
        // Follow
        const followData = {
          followerId: user.uid,
          followerName: user.displayName || 'Anonymous',
          followingId: roomData.hostId,
          followingName: roomData.hostName || 'User',
          createdAt: new Date(),
        };
        await addDoc(followersRef, followData);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleTransferHost = async (participantId, participantName) => {
    // Only main host can transfer control
    const mainHostId = roomData?.mainHostId || roomData?.hostId;
    if (user?.uid !== mainHostId) {
      Alert.alert('Permission Denied', 'Only the main host can transfer control.');
      return;
    }

    Alert.alert(
      'Transfer Control',
      `Give control to ${participantName}? They will be able to control playback until you take it back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: async () => {
            try {
              const roomRef = doc(db, 'rooms', roomId);
              await updateDoc(roomRef, {
                hostId: participantId,
                hostName: participantName,
                mainHostId: mainHostId, // Keep track of original host
              });
              Alert.alert('Success', `${participantName} now has control of the room.`);
            } catch (error) {
              console.error('Error transferring host:', error);
              Alert.alert('Error', 'Failed to transfer control. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReclaimHost = async () => {
    // Only main host can reclaim control
    const mainHostId = roomData?.mainHostId || roomData?.hostId;
    if (user?.uid !== mainHostId) {
      return;
    }

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        hostId: mainHostId,
        hostName: user.displayName || 'Host',
      });
      Alert.alert('Success', 'You have reclaimed control of the room.');
    } catch (error) {
      console.error('Error reclaiming host:', error);
      Alert.alert('Error', 'Failed to reclaim control. Please try again.');
    }
  };

  // Wrapper function for host to control playback and sync with Firebase
  const handleTogglePlayPause = async () => {
    // Only host can control playback
    if (roomData?.hostId !== user?.uid) {
      return; // Participants can't control playback
    }
    
    // Get current state before toggling
    const willBePlaying = !isPlaying;
    
    // If pausing, get the current position to sync participants
    let currentPosition = position;
    if (!willBePlaying && sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          currentPosition = status.positionMillis;
        }
      } catch (e) {
        console.log('Error getting position:', e);
      }
    }
    
    // Toggle locally first
    await togglePlayPause();
    
    // Then update Firebase so participants sync
    if (roomId) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        const updateData = {
          isPlaying: willBePlaying,
          lastUpdated: new Date()
        };
        
        // When pausing or playing, update the seek position so participants sync
        if (!willBePlaying) {
          // Pausing: save current position
          updateData.seekPosition = currentPosition;
          updateData.seekTimestamp = Date.now();
        } else if (sound) {
          // Playing: also sync current position in case of desync
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              updateData.seekPosition = status.positionMillis;
              updateData.seekTimestamp = Date.now();
            }
          } catch (e) {
            console.log('Error getting position on play:', e);
          }
        }
        
        await updateDoc(roomRef, updateData);
      } catch (error) {
        console.error('Error updating playback state:', error);
      }
    }
  };

  const handlePlaySong = async (song) => {
    // Only host can select songs
    if (roomData?.hostId !== user?.uid) {
      return;
    }
    
    await playSong(song);
    
    // Update current song in Firebase so all participants load it
    if (roomId) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          currentSong: {
            id: song.id,
            title: song.title,
            artist: song.artist,
          },
          isPlaying: true,
          seekPosition: 0,
          seekTimestamp: Date.now(),
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error updating current song:', error);
      }
    }
  };

  const handleSeekToPosition = async (position) => {
    await seekToPosition(position);
    
    // Update position in Firebase so all participants sync
    if (roomId && roomData?.hostId === user?.uid) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          seekPosition: position,
          seekTimestamp: Date.now(),
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error updating seek position:', error);
      }
    }
  };

  const handleEndStream = () => {
    Alert.alert(
      'End Stream',
      'Are you sure you want to end this stream? All participants will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              if (roomId) {
                await deleteDoc(doc(db, 'rooms', roomId));
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error ending stream:', error);
              Alert.alert('Error', 'Failed to end the stream. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Stream',
      'Are you sure you want to leave this stream? The music will stop playing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (roomId && user?.uid) {
                const roomRef = doc(db, 'rooms', roomId);
                await updateDoc(roomRef, {
                  participants: arrayRemove(user.uid),
                  participantCount: increment(-1)
                });
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error leaving room:', error);
              Alert.alert('Error', 'Failed to leave the room. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleKickParticipant = (participantId, participantName) => {
    Alert.alert(
      'Kick Participant',
      `Are you sure you want to kick ${participantName} from this stream?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick',
          style: 'destructive',
          onPress: async () => {
            try {
              if (roomId) {
                const roomRef = doc(db, 'rooms', roomId);
                await updateDoc(roomRef, {
                  participants: arrayRemove(participantId),
                  participantCount: increment(-1)
                });
              }
            } catch (error) {
              console.error('Error kicking participant:', error);
              Alert.alert('Error', 'Failed to kick participant. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleSearchUsers = async (searchText) => {
    setUserSearchQuery(searchText);
    
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users = [];
      
      const searchLower = searchText.toLowerCase();
      
      querySnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        const displayNameLower = (userData.displayName || '').toLowerCase();
        const emailLower = (userData.email || '').toLowerCase();
        
        // Case-insensitive search on displayName or email
        if (
          (displayNameLower.includes(searchLower) || emailLower.includes(searchLower)) &&
          !participants.includes(doc.id)
        ) {
          users.push(userData);
        }
      });
      
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddParticipant = async (userId, userName) => {
    try {
      if (roomId) {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          participants: arrayUnion(userId),
          participantCount: increment(1)
        });
        
        // Clear search and close modal
        setUserSearchQuery('');
        setSearchResults([]);
        setShowAddParticipant(false);
        
        Alert.alert('Success', `${userName} has been added to the room.`);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      Alert.alert('Error', 'Failed to add participant. Please try again.');
    }
  };
  
  // Mock challenge images with votes
  const [challengeImages, setChallengeImages] = useState([
    { id: 1, uri: 'https://via.placeholder.com/300', user: '@user1', votes: 15 },
    { id: 2, uri: 'https://via.placeholder.com/300', user: '@user2', votes: 23 },
    { id: 3, uri: 'https://via.placeholder.com/300', user: '@user3', votes: 8 },
    { id: 4, uri: 'https://via.placeholder.com/300', user: '@user4', votes: 31 },
    { id: 5, uri: 'https://via.placeholder.com/300', user: '@user5', votes: 19 },
  ]);

  const handleDoubleTap = (imageId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap detected - vote!
      setChallengeImages(prev =>
        prev.map(img =>
          img.id === imageId ? { ...img, votes: img.votes + 1 } : img
        )
      );
      setLastTap(null); // Reset after successful double tap
    } else {
      // First tap
      setLastTap(now);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now(), text: message, user: 'You' }]);
      setMessage('');
    }
  };

  // Sort images by votes (highest to lowest) and add position
  const sortedImages = [...challengeImages]
    .sort((a, b) => b.votes - a.votes)
    .map((img, index) => ({ ...img, position: index + 1 }));

  const getRankBorder = (position) => {
    if (position === 1) return { borderColor: COLORS.gold, borderWidth: 4 };
    if (position === 2) return { borderColor: COLORS.silver, borderWidth: 4 };
    if (position === 3) return { borderColor: '#CD7F32', borderWidth: 4 }; // Bronze
    return { borderColor: COLORS.surfaceLight, borderWidth: 2 };
  };

  const getRankBadge = (position) => {
    if (position === 1) return { emoji: '🥇', style: styles.goldBadge };
    if (position === 2) return { emoji: '🥈', style: styles.silverBadge };
    if (position === 3) return { emoji: '🥉', style: styles.bronzeBadge };
    return null;
  };

  const getPositionSuffix = (position) => {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle} numberOfLines={1}>
            {roomData?.name || 'Best Baby Photo Challenge 👶'}
          </Text>
          <Text style={styles.roomHost}>
            Hosted by {roomData?.hostName ? `@${roomData.hostName}` : '@user'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowRoomMenu(!showRoomMenu)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Room Menu */}
      {showRoomMenu && (
        <View style={styles.roomMenu}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              setShowRoomMenu(false);
              setShowParticipants(true);
            }}
          >
            <Ionicons name="people" size={24} color={COLORS.text} />
            <Text style={styles.menuItemText}>Participants ({participants.length})</Text>
          </TouchableOpacity>
          
          {roomData?.hostId === user?.uid && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowRoomMenu(false);
                setShowAddParticipant(true);
              }}
            >
              <Ionicons name="person-add" size={24} color={COLORS.text} />
              <Text style={styles.menuItemText}>Add Participant</Text>
            </TouchableOpacity>
          )}
          
          {roomData?.hostId === user?.uid ? (
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setShowRoomMenu(false);
                handleEndStream();
              }}
            >
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>End Stream</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={() => {
                setShowRoomMenu(false);
                handleLeaveRoom();
              }}
            >
              <Ionicons name="exit-outline" size={24} color={COLORS.error} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Leave Stream</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <View style={styles.participantsModal}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>Participants ({participants.length})</Text>
            <TouchableOpacity onPress={() => setShowParticipants(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={participants}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item: participantId }) => {
              const participantInfo = participantDetails[participantId];
              const displayName = participantInfo?.displayName || `User ${participantId.slice(0, 6)}`;
              
              return (
                <View style={styles.participantItem}>
                  <Ionicons name="person-circle" size={32} color={COLORS.primary} />
                  <Text style={styles.participantName}>
                    {participantId === roomData?.hostId && '👑 '}
                    {participantId === user?.uid ? 'You' : displayName}
                  </Text>
                  {roomData?.hostId === user?.uid && participantId !== user?.uid && (
                    <TouchableOpacity 
                      onPress={() => handleKickParticipant(participantId, displayName)}
                      style={styles.kickButton}
                    >
                      <Ionicons name="remove-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </View>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <View style={styles.participantsModal}>
          <View style={styles.participantsHeader}>
            <Text style={styles.participantsTitle}>Add Participant</Text>
            <TouchableOpacity onPress={() => {
              setShowAddParticipant(false);
              setUserSearchQuery('');
              setSearchResults([]);
            }}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username..."
              placeholderTextColor={COLORS.textMuted}
              value={userSearchQuery}
              onChangeText={handleSearchUsers}
              autoCapitalize="none"
            />
            {isSearching && (
              <Ionicons name="hourglass" size={20} color={COLORS.primary} />
            )}
          </View>

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.participantItem}>
                  <Ionicons name="person-circle" size={32} color={COLORS.primary} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {item.displayName || 'Anonymous'}
                    </Text>
                    {item.email && (
                      <Text style={styles.participantEmail}>{item.email}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleAddParticipant(item.id, item.displayName || 'User')}
                    style={styles.addButton}
                  >
                    <Ionicons name="add-circle" size={28} color={COLORS.success} />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : userSearchQuery.trim() ? (
            <View style={styles.emptySearchResults}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptySearchText}>
                {isSearching ? 'Searching...' : 'No users found'}
              </Text>
              <Text style={styles.emptySearchSubtext}>
                Try searching with a different username
              </Text>
            </View>
          ) : (
            <View style={styles.emptySearchResults}>
              <Ionicons name="person-add-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptySearchText}>Search for users</Text>
              <Text style={styles.emptySearchSubtext}>
                Enter a username to find people to add
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Playlist Modal - Host Only */}
      {showPlaylist && (
        <View style={styles.playlistModal}>
          <View style={styles.playlistModalHeader}>
            <View style={styles.playlistModalTitleContainer}>
              <Ionicons name="list" size={24} color={COLORS.primary} />
              <Text style={styles.playlistModalTitle}>Playlist ({playlist.length}/5)</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPlaylist(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={playlist}
            keyExtractor={(item) => item.id}
            renderItem={({ item: song }) => (
              <TouchableOpacity
                style={[
                  styles.playlistModalItem,
                  currentSong?.id === song.id && styles.playlistModalItemActive
                ]}
                onPress={() => {
                  if (roomData?.hostId === user?.uid) {
                    handlePlaySong(song);
                    setShowPlaylist(false);
                  }
                }}
                disabled={roomData?.hostId !== user?.uid}
              >
                <Image
                  source={
                    song.coverUrl && song.coverUrl !== 'default'
                      ? { uri: song.coverUrl }
                      : require('../../../assets/images/logo.png')
                  }
                  style={styles.playlistModalItemImage}
                />
                <View style={styles.playlistModalItemInfo}>
                  <Text 
                    style={[
                      styles.playlistModalItemTitle,
                      currentSong?.id === song.id && styles.playlistModalItemTitleActive
                    ]} 
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>
                  <Text style={styles.playlistModalItemArtist} numberOfLines={1}>
                    {song.artist}
                  </Text>
                </View>
                {currentSong?.id === song.id && (
                  <View style={styles.nowPlayingBadge}>
                    <Ionicons 
                      name={isPlaying ? "volume-high" : "pause"} 
                      size={20} 
                      color={COLORS.primary} 
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyPlaylist}>
                <Ionicons name="musical-notes-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyPlaylistText}>No songs in playlist</Text>
              </View>
            }
          />
        </View>
      )}

      <View style={styles.mainContent}>
        {/* Main Challenge Area */}
        <View style={styles.leftSection}>
          {/* Challenge Title Card */}
          <View style={styles.challengeTitleCard}>
            <Text style={styles.challengeEmoji}>👶</Text>
            <Text style={styles.challengeTitle}>Best Baby Photo</Text>
            <Text style={styles.challengeSubtitle}>Double-tap to vote for your favorite!</Text>
          </View>

          {/* Image Carousel */}
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / CHALLENGE_IMAGE_SIZE);
                setCurrentImageIndex(index);
              }}
              contentContainerStyle={styles.carouselContent}
            >
              {sortedImages.map((image, index) => {
                const rankBadge = getRankBadge(image.position);
                return (
                  <TouchableOpacity
                    key={image.id}
                    activeOpacity={0.9}
                    onPress={() => handleDoubleTap(image.id)}
                    style={styles.imageWrapper}
                  >
                    <View style={[styles.challengeImageCard, getRankBorder(image.position)]}>
                      <Image source={{ uri: image.uri }} style={styles.challengeImage} />
                      
                      {/* Rank Badge - Top Left */}
                      {rankBadge && (
                        <View style={[styles.rankBadge, rankBadge.style]}>
                          <Text style={styles.rankText}>{rankBadge.emoji}</Text>
                        </View>
                      )}
                      
                      {/* Position Number - Top Right */}
                      <View style={styles.positionBadge}>
                        <Text style={styles.positionText}>
                          {image.position}{getPositionSuffix(image.position)}
                        </Text>
                      </View>
                      
                      {/* Vote Count - Bottom Right */}
                      <View style={styles.voteButton}>
                        <Ionicons name="heart" size={24} color={COLORS.error} />
                        <Text style={styles.voteCount}>{image.votes}</Text>
                      </View>
                      
                      {/* User Tag - Bottom */}
                      <View style={styles.userTag}>
                        <Text style={styles.userName}>{image.user}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Carousel Indicators */}
            <View style={styles.indicators}>
              {sortedImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex && styles.indicatorActive
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Mini Music Player */}
          <View style={styles.miniPlayer}>
            <Image
              source={
                currentSong?.posterUrl && currentSong.posterUrl !== 'default'
                  ? { uri: currentSong.posterUrl }
                  : require('../../../assets/images/poster.png')
              }
              style={styles.miniAlbumArt}
            />
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniTrackTitle} numberOfLines={1}>
                {currentSong?.title || 'No song playing'}
              </Text>
              <Text style={styles.miniArtistName} numberOfLines={1}>
                {currentSong?.artist || 'Select a song'}
              </Text>
              {/* Progress Bar - Host Only */}
              {roomData?.hostId === user?.uid && (
                <View style={styles.miniProgressContainer}>
                  <Text style={styles.miniProgressTime}>{formatTime(position)}</Text>
                  <Slider
                    style={styles.miniProgressBar}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={position}
                    onSlidingComplete={handleSeekToPosition}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.surfaceLight}
                    thumbTintColor={COLORS.primary}
                  />
                  <Text style={styles.miniProgressTime}>{formatTime(duration)}</Text>
                </View>
              )}
            </View>
            <View style={styles.miniPlayerControls}>
              <TouchableOpacity 
                style={styles.miniLikeButton}
                onPress={handleLike}
                disabled={!currentSong}
              >
                <Ionicons 
                  name={isLiked ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isLiked ? COLORS.accent : COLORS.text} 
                />
                <Text style={[styles.miniLikeCount, isLiked && styles.miniLikeCountActive]}>
                  {likeCount > 0 ? likeCount : ''}
                </Text>
              </TouchableOpacity>
              {/* Playlist Button - Host Only */}
              {roomData?.hostId === user?.uid && playlist.length > 0 && (
                <TouchableOpacity 
                  style={styles.miniIconButton}
                  onPress={() => setShowPlaylist(true)}
                >
                  <Ionicons 
                    name="list" 
                    size={24} 
                    color={COLORS.text} 
                  />
                  {playlist.length > 0 && (
                    <Text style={styles.miniIconButtonCount}>
                      {playlist.length}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {/* Follow Button - Non-host Only */}
              {roomData?.hostId && user?.uid && roomData.hostId !== user.uid && (
                <TouchableOpacity 
                  style={[styles.miniFollowButton, isFollowing && styles.miniFollowingButton]}
                  onPress={handleFollow}
                >
                  <Ionicons 
                    name={isFollowing ? 'checkmark' : 'person-add'} 
                    size={18} 
                    color={COLORS.text} 
                  />
                </TouchableOpacity>
              )}
              {roomData?.hostId === user?.uid ? (
                <TouchableOpacity 
                  style={styles.miniPlayButton}
                  onPress={handleTogglePlayPause}
                  disabled={!currentSong || isBuffering}
                >
                  {isBuffering ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Ionicons 
                      name={isPlaying ? "pause-circle" : "play-circle"} 
                      size={36} 
                      color={COLORS.primary} 
                    />
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.miniPlayButtonLocked}>
                  <Ionicons 
                    name={isPlaying ? "pause-circle" : "play-circle"} 
                    size={36} 
                    color={COLORS.textMuted} 
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Right: Chat Panel */}
        {showChat && (
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
                <Text style={styles.chatHeaderTitle}>Live Chat</Text>
              </View>
              <View style={styles.participantsCount}>
                <Ionicons name="people" size={16} color={COLORS.text} />
                <Text style={styles.participantsText}>{roomData?.participantCount || 0}</Text>
              </View>
            </View>

          <ScrollView 
            style={styles.chatMessages} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.chatMessagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyChatText}>No messages yet</Text>
                <Text style={styles.emptyChatSubtext}>Be the first to say something!</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id} style={styles.chatMessage}>
                  <Text style={styles.messageUser}>{msg.user}:</Text>
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TouchableOpacity style={styles.imageButton}>
              <Ionicons name="image-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <Ionicons 
                name="send" 
                size={24} 
                color={message.trim() ? COLORS.primary : COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Chat Toggle Button */}
        <TouchableOpacity 
          style={styles.chatToggleButton}
          onPress={() => setShowChat(!showChat)}
        >
          <Ionicons 
            name={showChat ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  roomTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomHost: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Main Content
  mainContent: {
    flex: 1,
  },
  leftSection: {
    flex: 1,
    padding: SPACING.lg,
  },
  // Challenge Title Card
  challengeTitleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  challengeEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  challengeTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  challengeSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Carousel
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: SPACING.lg,
  },
  imageWrapper: {
    marginRight: SPACING.lg,
  },
  challengeImageCard: {
    width: CHALLENGE_IMAGE_SIZE,
    height: CHALLENGE_IMAGE_SIZE,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  challengeImage: {
    width: '100%',
    height: '100%',
  },
  // Badges
  rankBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    fontSize: 24,
  },
  // Position Badge (Top Right)
  positionBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  positionText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  // Vote Button
  voteButton: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  voteCount: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  // User Tag
  userTag: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  userName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Indicators
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  // Mini Player
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.xl,
  },
  miniAlbumArt: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  miniPlayerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  miniTrackTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  miniArtistName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  miniProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  miniProgressTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    width: 35,
  },
  miniProgressBar: {
    flex: 1,
    height: 15,
    marginHorizontal: SPACING.xs,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  miniLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  miniIconButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  miniIconButtonCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 16,
    textAlign: 'center',
  },
  miniFollowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
  },
  miniFollowingButton: {
    backgroundColor: COLORS.surface,
  },
  miniPlaylistButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  miniLikeCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  miniLikeCountActive: {
    color: COLORS.accent,
  },
  miniPlayButton: {
    marginLeft: SPACING.xs,
  },
  miniPlayButtonLocked: {
    marginLeft: SPACING.xs,
    opacity: 0.5,
  },
  // Chat Panel
  chatPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    paddingTop: 90,
    zIndex: 100,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    borderTopLeftRadius: BORDER_RADIUS.xl,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  participantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  participantsText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.91)',
  },
  chatMessagesContent: {
    padding: SPACING.md,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyChatText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyChatSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  chatMessage: {
    marginBottom: SPACING.md,
  },
  messageUser: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  messageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginTop: 2,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    borderBottomLeftRadius: BORDER_RADIUS.xl,
  },
  imageButton: {
    marginRight: SPACING.sm,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    marginRight: SPACING.sm,
  },
  sendButton: {
    padding: SPACING.xs,
  },
  chatToggleButton: {
    position: 'absolute',
    top: 80,
    right: 0,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    width: 40,
    height: 40,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 20,
    zIndex: 200,
  },
  // Room Menu
  roomMenu: {
    position: 'absolute',
    top: 90,
    right: SPACING.md,
    width: 220,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 150,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  menuItemTextDanger: {
    color: COLORS.error,
  },
  // Participants Modal
  participantsModal: {
    position: 'absolute',
    top: 90,
    right: SPACING.md,
    width: 280,
    maxHeight: 400,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 150,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  participantsTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  participantInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  participantName: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  participantEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    marginTop: 2,
  },
  kickButton: {
    padding: SPACING.xs,
  },
  addButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    padding: 0,
  },
  emptySearchResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptySearchText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySearchSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  // Playlist Modal
  playlistModal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -175 }, { translateY: -250 }],
    width: 350,
    maxHeight: 500,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 150,
  },
  playlistModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  playlistModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  playlistModalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  playlistModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    backgroundColor: COLORS.surface,
  },
  playlistModalItemActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  playlistModalItemImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md,
  },
  playlistModalItemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  playlistModalItemTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  playlistModalItemTitleActive: {
    color: COLORS.primary,
  },
  playlistModalItemArtist: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  nowPlayingBadge: {
    padding: SPACING.xs,
  },
  emptyPlaylist: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyPlaylistText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});

export default ChallengeRoomScreen;
