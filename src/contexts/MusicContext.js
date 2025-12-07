import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const MusicContext = createContext({});

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef(null);

  useEffect(() => {
    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadTrack = async (track) => {
    try {
      // Unload previous track
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Load new track
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error loading track:', error);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        // Handle track end
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const play = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const seek = async (positionMillis) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(positionMillis);
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const playVoiceReaction = async (reactionSound) => {
    // TODO: Implement voice reaction sounds later
    console.log('Voice reaction triggered:', reactionSound);
  };

  const value = {
    currentTrack,
    isPlaying,
    position,
    duration,
    loadTrack,
    play,
    pause,
    seek,
    stop,
    playVoiceReaction,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};
