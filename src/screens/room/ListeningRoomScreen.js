import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
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
import { VOICE_REACTIONS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useMusicPlayer } from '../../contexts/MusicPlayerContext';

const { width, height } = Dimensions.get('window');

const ListeningRoomScreen = ({ navigation, route }) => {
  const { roomId } = route.params || {};
  const { user } = useAuth();
  const { 
    currentSong, 
    isPlaying, 
    position, 
    duration, 
    isBuffering,
    hasPlaylist,
    sound,
    playNext,
    playPrevious,
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
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [activeReactions, setActiveReactions] = useState([]);
  const lastReactionCountRef = useRef(0);
  const lastSeekTimestampRef = useRef(0);
  const prevRoomDataRef = useRef(null);
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
        
        // Check for new reactions and display them
        const reactions = data.reactions || [];
        if (reactions.length > lastReactionCountRef.current) {
          // Get only the new reactions
          const newReactions = reactions.slice(lastReactionCountRef.current);
          newReactions.forEach(reaction => {
            displayReaction(reaction.emoji);
          });
          lastReactionCountRef.current = reactions.length;
        }
        
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
                  // Sync play/pause
                  if (data.isPlaying && !status.isPlaying) {
                    await sound.playAsync();
                    setIsPlaying(true); // Update UI state
                  } else if (!data.isPlaying && status.isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false); // Update UI state
                  }
                  
                  // Sync seek position if host seeked
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

  // Wrapper functions for host to control playback and sync with Firebase
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

  const handlePlayNext = async () => {
    // Only host can control playback
    if (roomData?.hostId !== user?.uid) {
      return;
    }
    
    await playNext();
    
    // Update current song in Firebase
    if (roomId && currentSong) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          currentSong: {
            id: currentSong.id,
            title: currentSong.title,
            artist: currentSong.artist,
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

  const handlePlayPrevious = async () => {
    // Only host can control playback
    if (roomData?.hostId !== user?.uid) {
      return;
    }
    
    await playPrevious();
    
    // Update current song in Firebase
    if (roomId && currentSong) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          currentSong: {
            id: currentSong.id,
            title: currentSong.title,
            artist: currentSong.artist,
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

  const handleVoiceReaction = async (reaction) => {
    // Save reaction to Firebase so all participants can see it
    if (roomId && user?.uid) {
      try {
        const reactionData = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          emoji: reaction.emoji,
          timestamp: new Date(),
        };
        
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          reactions: arrayUnion(reactionData),
        });
      } catch (error) {
        console.error('Error sending reaction:', error);
      }
    }
  };

  // Display reaction animation locally
  const displayReaction = (emoji) => {
    const reactionId = Date.now() + Math.random();
    const startX = Math.random() * (width - 100);
    const animatedValue = new Animated.Value(0);
    
    const newReaction = {
      id: reactionId,
      emoji,
      animatedValue,
      startX,
    };
    
    setActiveReactions(prev => [...prev, newReaction]);
    
    // Animate the reaction
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
    }).start(() => {
      // Remove reaction after animation completes
      setActiveReactions(prev => prev.filter(r => r.id !== reactionId));
    });
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { id: Date.now(), text: message, user: 'You' }]);
      setMessage('');
    }
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
          <Text style={styles.roomTitle}>{roomData?.name || 'Friday Night Vibes 🎵'}</Text>
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
              const mainHostId = roomData?.mainHostId || roomData?.hostId;
              const isMainHost = user?.uid === mainHostId;
              const isCurrentHost = participantId === roomData?.hostId;
              
              return (
                <View style={styles.participantItem}>
                  <Ionicons name="person-circle" size={32} color={COLORS.primary} />
                  <Text style={styles.participantName}>
                    {isCurrentHost && '👑 '}
                    {participantId === user?.uid ? 'You' : displayName}
                    {isCurrentHost && participantId !== mainHostId && ' (Host)'}
                  </Text>
                  <View style={styles.participantActions}>
                    {/* Transfer Host Button - Only main host sees this */}
                    {isMainHost && participantId !== user?.uid && (
                      <TouchableOpacity 
                        onPress={() => {
                          if (isCurrentHost) {
                            handleReclaimHost();
                          } else {
                            handleTransferHost(participantId, displayName);
                          }
                        }}
                        style={styles.transferHostButton}
                      >
                        <Ionicons 
                          name={isCurrentHost ? "arrow-back-circle" : "shield-checkmark"} 
                          size={24} 
                          color={isCurrentHost ? COLORS.warning : COLORS.primary} 
                        />
                      </TouchableOpacity>
                    )}
                    {/* Kick Button */}
                    {roomData?.hostId === user?.uid && participantId !== user?.uid && participantId !== mainHostId && (
                      <TouchableOpacity 
                        onPress={() => handleKickParticipant(participantId, displayName)}
                        style={styles.kickButton}
                      >
                        <Ionicons name="remove-circle" size={24} color={COLORS.error} />
                      </TouchableOpacity>
                    )}
                  </View>
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
        {/* Left: Album Art & Info */}
        <View style={styles.musicSection}>
          {/* Album/Artist Poster */}
          <View style={styles.posterContainer}>
            <Image
              source={
                currentSong?.posterUrl && currentSong.posterUrl !== 'default'
                  ? { uri: currentSong.posterUrl }
                  : require('../../../assets/images/poster.png')
              }
              style={styles.posterImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.posterOverlay}
            />
            {/* Track info overlay on poster */}
            <View style={styles.posterInfo}>
              <Text style={styles.posterTrackTitle}>
                {currentSong?.title || 'No song playing'}
              </Text>
              <Text style={styles.posterArtistName}>
                {currentSong?.artist || 'Select a song to start'}
              </Text>
            </View>
          </View>

          {/* Player Controls - Only for Host */}
          {roomData?.hostId === user?.uid ? (
            <View style={styles.playerControls}>
              {hasPlaylist && (
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={handlePlayPrevious}
                >
                  <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.playButton}
                onPress={handleTogglePlayPause}
                disabled={isBuffering}
              >
                <LinearGradient colors={GRADIENTS.primary} style={styles.playButtonGradient}>
                  {isBuffering ? (
                    <Ionicons name="hourglass" size={40} color={COLORS.text} />
                  ) : (
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={40}
                      color={COLORS.text}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              {hasPlaylist && (
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={handlePlayNext}
                >
                  <Ionicons name="play-skip-forward" size={32} color={COLORS.text} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.participantControls}>
              <View style={styles.playButtonLocked}>
                <LinearGradient colors={GRADIENTS.primary} style={styles.playButtonGradient}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={40}
                    color={COLORS.text}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.participantText}>Host is in control</Text>
            </View>
          )}

          {/* Progress Bar - Only for Host */}
          {roomData?.hostId === user?.uid && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressTime}>{formatTime(position)}</Text>
              <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={duration || 1}
                value={position}
                onSlidingComplete={handleSeekToPosition}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.surfaceLight}
                thumbTintColor={COLORS.primary}
              />
              <Text style={styles.progressTime}>{formatTime(duration)}</Text>
            </View>
          )}

          {/* Like Button */}
          {/* Like and Playlist Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={handleLike}
              disabled={!currentSong}
            >
              <Ionicons 
                name={isLiked ? 'heart' : 'heart-outline'} 
                size={28} 
                color={isLiked ? COLORS.accent : COLORS.text} 
              />
              <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                {likeCount > 0 ? likeCount.toLocaleString() : 'Like'}
              </Text>
            </TouchableOpacity>

            {/* Playlist Button - Host Only */}
            {roomData?.hostId === user?.uid && playlist.length > 0 && (
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => setShowPlaylist(true)}
              >
                <Ionicons 
                  name="list" 
                  size={28} 
                  color={COLORS.text} 
                />
                {playlist.length > 0 && (
                  <Text style={styles.iconButtonCount}>
                    {playlist.length}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Follow Button - Non-host Only */}
            {roomData?.hostId && user?.uid && roomData.hostId !== user.uid && (
              <TouchableOpacity 
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <Ionicons 
                  name={isFollowing ? 'checkmark' : 'person-add'} 
                  size={20} 
                  color={COLORS.text} 
                />
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Host Transfer Button - Main Host Only */}
            {(() => {
              const mainHostId = roomData?.mainHostId || roomData?.hostId;
              const isMainHost = user?.uid === mainHostId;
              const isCurrentHost = roomData?.hostId === user?.uid;
              
              // Show for main host when they're not the current host (to reclaim)
              if (isMainHost && !isCurrentHost) {
                return (
                  <TouchableOpacity 
                    style={styles.reclaimHostButton}
                    onPress={handleReclaimHost}
                  >
                    <Ionicons 
                      name="arrow-back-circle" 
                      size={20} 
                      color={COLORS.text} 
                    />
                    <Text style={styles.followButtonText}>
                      Take
                    </Text>
                  </TouchableOpacity>
                );
              }
              
              // Show participants button for main host to open participants modal
              if (isMainHost && isCurrentHost) {
                return (
                  <TouchableOpacity 
                    style={styles.hostControlButton}
                    onPress={() => setShowParticipants(true)}
                  >
                    <Ionicons 
                      name="shield-checkmark" 
                      size={20} 
                      color={COLORS.text} 
                    />
                    <Text style={styles.followButtonText}>
                      Transfer
                    </Text>
                  </TouchableOpacity>
                );
              }
              
              return null;
            })()}
          </View>

          {/* Voice Reactions */}
          <View style={styles.reactions}>
            <Text style={styles.reactionsTitle}>Quick Reactions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {VOICE_REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.id}
                  style={styles.reactionButton}
                  onPress={() => handleVoiceReaction(reaction)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                  <Text style={styles.reactionLabel}>{reaction.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Listener Count Badge */}
          <View style={styles.listenerBadge}>
            <View style={styles.liveDot} />
            <Ionicons name="people" size={16} color={COLORS.text} />
            <Text style={styles.listenerText}>{roomData?.participantCount || 0}</Text>
          </View>
        </View>

        {/* Chat Panel Overlay - Right Side */}
        {showChat && (
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
              <Text style={styles.chatTitle}>Live Chat</Text>
              <View style={styles.chatCount}>
                <Text style={styles.chatCountText}>{messages.length}</Text>
              </View>
            </View>

            <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
              {messages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyChatText}>No messages yet</Text>
                  <Text style={styles.emptyChatSubtext}>Be the first to say something!</Text>
                </View>
              ) : (
                messages.map((msg) => (
                  <View key={msg.id} style={styles.chatMessage}>
                    <Text style={styles.chatUser}>{msg.user}</Text>
                    <Text style={styles.chatText}>{msg.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.chatInput}>
              <TouchableOpacity style={styles.imageButton}>
                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Say something..."
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity onPress={handleSendMessage}>
                <Ionicons name="send" size={24} color={COLORS.primary} />
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

      {/* Animated Reactions Overlay */}
      <View style={styles.reactionsOverlay} pointerEvents="none">
        {activeReactions.map((reaction) => {
          const translateY = reaction.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [height * 0.5, -100],
          });
          
          const opacity = reaction.animatedValue.interpolate({
            inputRange: [0, 0.1, 0.9, 1],
            outputRange: [0, 1, 1, 0],
          });
          
          const scale = reaction.animatedValue.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.5, 1.2, 0.8],
          });
          
          const rotate = reaction.animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.Text
              key={reaction.id}
              style={[
                styles.floatingReaction,
                {
                  left: reaction.startX,
                  transform: [
                    { translateY },
                    { scale },
                    { rotate },
                  ],
                  opacity,
                },
              ]}
            >
              {reaction.emoji}
            </Animated.Text>
          );
        })}
      </View>
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roomHost: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  musicSection: {
    flex: 1,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  posterContainer: {
    width: 200,
    height: 200,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  posterInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  posterTrackTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  posterArtistName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  albumArt: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
  },
  trackTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  artistName: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  participantControls: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  playButtonLocked: {
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  participantText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  controlButton: {
    padding: SPACING.md,
  },
  playButton: {
    marginHorizontal: SPACING.xl,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    marginBottom: SPACING.xl,
  },
  progressTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    width: 40,
  },
  progressBar: {
    flex: 1,
    height: 20,
    marginHorizontal: SPACING.md,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButtonCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    color: COLORS.text,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    textAlign: 'center',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: COLORS.surface,
  },
  followButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  hostControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reclaimHostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  likeCount: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    fontWeight: '600',
  },
  likeCountActive: {
    color: COLORS.accent,
  },
  reactions: {
    width: '100%',
    maxWidth: 500,
  },
  reactionsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  reactionButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  reactionEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  reactionLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
  },
  // Playlist Section
  playlistSection: {
    width: '100%',
    maxWidth: 500,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  playlistTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  playlistScroll: {
    maxHeight: 250,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  playlistItemActive: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  playlistItemImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  playlistItemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  playlistItemTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  playlistItemTitleActive: {
    color: COLORS.primary,
  },
  playlistItemArtist: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  nowPlayingIndicator: {
    marginLeft: SPACING.sm,
  },
  listenerBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  listenerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  // Chat Panel (Overlay)
  chatPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 100,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  chatCount: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  chatCountText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    marginTop: SPACING.xxl * 2,
  },
  emptyChatText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptyChatSubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  chatMessage: {
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  chatUser: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  chatText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(18, 18, 18, 0.93)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    marginRight: SPACING.sm,
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
  // Animated Reactions
  reactionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  floatingReaction: {
    position: 'absolute',
    fontSize: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  transferHostButton: {
    padding: SPACING.xs,
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

export default ListeningRoomScreen;
