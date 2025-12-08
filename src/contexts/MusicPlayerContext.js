import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};

export const MusicPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [sound, setSound] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const hasIncrementedPlayCount = useRef(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = async (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      setIsBuffering(status.isBuffering);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        
        // Restart the song from the beginning
        try {
          if (sound) {
            await sound.setPositionAsync(0);
            setPosition(0);
          }
        } catch (error) {
          console.error('Error resetting position:', error);
        }
        
        // Increment play count when song finishes
        if (currentSong?.id && !hasIncrementedPlayCount.current) {
          hasIncrementedPlayCount.current = true;
          try {
            const songRef = doc(db, 'songs', currentSong.id);
            await updateDoc(songRef, {
              plays: increment(1)
            });
            console.log('Play count incremented for song:', currentSong.id);
          } catch (error) {
            console.error('Error incrementing play count:', error);
          }
        }
      }
    }
  };

  const playSong = async (song) => {
    try {
      console.log('MusicPlayer: playSong called', { songId: song.id, currentSongId: currentSong?.id });
      
      // If clicking the same song that's currently playing
      if (currentSong?.id === song.id && sound) {
        // First check if sound is actually loaded
        try {
          const status = await sound.getStatusAsync();
          
          if (!status.isLoaded) {
            // Sound is not loaded, need to reload
            console.log('MusicPlayer: Sound not loaded, reloading song');
            throw new Error('Sound not loaded');
          }
          
          if (isPlaying) {
            console.log('MusicPlayer: Pausing current song');
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            // Check if song has finished (position is at or near duration)
            if (status.durationMillis && status.positionMillis >= status.durationMillis - 100) {
              console.log('MusicPlayer: Restarting finished song from beginning');
              await sound.setPositionAsync(0);
              setPosition(0);
            }
            console.log('MusicPlayer: Resuming current song');
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        } catch (error) {
          console.log('MusicPlayer: Error with current sound, will reload:', error.message);
          // Continue to reload the song below
        }
      }

      console.log('MusicPlayer: Loading new song');
      // Stop current song if playing a different one
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.log('MusicPlayer: Error unloading sound:', error.message);
        }
        setSound(null);
      }

      // Reset playback state and play count flag
      setPosition(0);
      setDuration(0);
      setIsBuffering(true);
      hasIncrementedPlayCount.current = false; // Reset flag for new song

      // Load and play new song
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true, volume: volume },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
      setIsBuffering(false);
      
      // Update current index in playlist if song is in the playlist
      const songIndex = playlist.findIndex(s => s.id === song.id);
      if (songIndex !== -1) {
        setCurrentIndex(songIndex);
      } else {
        setCurrentIndex(-1);
      }
      
      console.log('MusicPlayer: Song loaded and playing');
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Playback Error', 'Failed to play the song');
    }
  };

  const setPlaylistAndPlay = async (songs, startIndex = 0) => {
    setPlaylist(songs);
    setCurrentIndex(startIndex);
    if (songs.length > 0 && startIndex >= 0 && startIndex < songs.length) {
      await playSong(songs[startIndex]);
    }
  };

  const playNext = async () => {
    if (playlist.length === 0 || currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    await playSong(playlist[nextIndex]);
  };

  const playPrevious = async () => {
    if (playlist.length === 0 || currentIndex === -1) return;
    
    const previousIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(previousIndex);
    await playSong(playlist[previousIndex]);
  };

  const togglePlayPause = async () => {
    // If no sound and no currentSong, show message
    if (!sound && !currentSong) {
      Alert.alert('No Song Selected', 'Please select a song to play.');
      return;
    }

    // If no sound loaded but we have a currentSong, fetch and reload it
    if (!sound && currentSong?.id) {
      console.log('MusicPlayer: No sound loaded, fetching and reloading song from Firebase');
      try {
        const songRef = doc(db, 'songs', currentSong.id);
        const songDoc = await getDoc(songRef);
        
        if (songDoc.exists()) {
          const songData = { id: songDoc.id, ...songDoc.data() };
          await playSong(songData);
        } else {
          Alert.alert('Song Not Found', 'This song could not be found. It may have been deleted.');
          setCurrentSong(null);
        }
      } catch (error) {
        console.error('Error fetching song from Firebase:', error);
        Alert.alert('Error', 'Failed to load the song. Please try again.');
      }
      return;
    }

    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        // Check if song has finished and restart from beginning
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis && status.positionMillis >= status.durationMillis - 100) {
          console.log('MusicPlayer: Restarting finished song from beginning');
          await sound.setPositionAsync(0);
          setPosition(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      // If error occurs, try to fetch and reload the song from Firebase
      if (currentSong?.id) {
        console.log('MusicPlayer: Error occurred, fetching song from Firebase');
        try {
          const songRef = doc(db, 'songs', currentSong.id);
          const songDoc = await getDoc(songRef);
          
          if (songDoc.exists()) {
            const songData = { id: songDoc.id, ...songDoc.data() };
            await playSong(songData);
          } else {
            Alert.alert('Song Not Found', 'This song could not be found. It may have been deleted.');
            setCurrentSong(null);
          }
        } catch (fetchError) {
          console.error('Error fetching song from Firebase:', fetchError);
          Alert.alert('Error', 'Failed to load the song. Please try again.');
        }
      }
    }
  };

  const stopSong = async () => {
    try {
      console.log('MusicPlayer: Stopping song');
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (error) {
          console.log('MusicPlayer: Error stopping sound:', error.message);
          // Try to unload anyway if stop fails
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.log('MusicPlayer: Error unloading sound:', e.message);
          }
        }
        setSound(null);
      }
      setCurrentSong(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setIsBuffering(false);
      setPlaylist([]);
      setCurrentIndex(-1);
      hasIncrementedPlayCount.current = false; // Reset flag when stopping
      console.log('MusicPlayer: Song stopped and cleared');
    } catch (error) {
      console.error('Error stopping song:', error);
    }
  };

  const changeVolume = async (newVolume) => {
    setVolume(newVolume);
    if (sound) {
      try {
        await sound.setVolumeAsync(newVolume);
      } catch (error) {
        console.error('Error changing volume:', error);
      }
    }
  };

  const seekToPosition = async (positionMillis) => {
    if (sound) {
      try {
        await sound.setPositionAsync(positionMillis);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  // Helper function to format time in mm:ss
  const formatTime = (millis) => {
    if (!millis || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const value = {
    currentSong,
    isPlaying,
    volume,
    position,
    duration,
    isBuffering,
    playlist,
    currentIndex,
    hasPlaylist: playlist.length > 0,
    sound,
    playSong,
    setPlaylistAndPlay,
    playNext,
    playPrevious,
    togglePlayPause,
    stopSong,
    changeVolume,
    seekToPosition,
    formatTime,
    setSound,
    setCurrentSong,
    setIsPlaying,
    setPosition,
    setDuration,
    setIsBuffering,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};
