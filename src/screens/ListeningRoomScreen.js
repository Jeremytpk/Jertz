import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS, SHADOWS } from '../config/theme';
import { VOICE_REACTIONS } from '../config/constants';
import { useMusic } from '../contexts/MusicContext';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const ListeningRoomScreen = ({ navigation, route }) => {
  const { roomId } = route.params;
  const { user } = useAuth();
  const { isPlaying, play, pause, playVoiceReaction } = useMusic();
  const [message, setMessage] = useState('');
  const [isHost, setIsHost] = useState(true); // TODO: Get from Firebase
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState([
    { id: 1, user: 'John', message: 'This track is fire! 🔥', timestamp: '10:30 AM' },
    { id: 2, user: 'Sarah', message: 'Love this!', timestamp: '10:31 AM' },
    { id: 3, user: 'Mike', message: 'Who\'s the artist?', timestamp: '10:32 AM' },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        user: 'You',
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setMessage('');
    }
  };

  const handleVoiceReaction = (reaction) => {
    playVoiceReaction(reaction.sound);
    // TODO: Broadcast to all users in room
  };

  const handlePassTheMic = () => {
    // TODO: Show user list and pass host controls
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.dark} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle} numberOfLines={1}>Chill Vibes Room 🎵</Text>
          <Text style={styles.roomHost}>
            Hosted by {user?.displayName ? `@${user.displayName}` : '@user'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.mainContent}>
        {/* Left/Center: Album Art & Music Info */}
        <View style={styles.musicSection}>
          {/* Album Art */}
          <View style={styles.albumArtContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/300' }}
              style={styles.albumArt}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.albumOverlay}
            />
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>Track Name Goes Here</Text>
            <Text style={styles.artistName}>Artist Name</Text>
            <Text style={styles.albumName}>Album Name • 2024</Text>
          </View>

          {/* Music Controls */}
          <View style={styles.musicControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying ? pause : play}
            >
              <LinearGradient colors={GRADIENTS.primary} style={styles.playButtonGradient}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={40}
                  color={COLORS.text}
                />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="play-skip-forward" size={32} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Voice Reactions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reactionsScroll}
            contentContainerStyle={styles.reactions}
          >
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

          {/* Host Controls */}
          {isHost && (
            <TouchableOpacity style={styles.passMicButton} onPress={handlePassTheMic}>
              <Ionicons name="mic" size={20} color={COLORS.text} />
              <Text style={styles.passMicText}>Pass the Mic</Text>
            </TouchableOpacity>
          )}
          
          {/* Listener Count Badge */}
          <View style={styles.listenerBadge}>
            <View style={styles.liveDot} />
            <Ionicons name="people" size={16} color={COLORS.text} />
            <Text style={styles.listenerText}>25</Text>
          </View>
        </View>

        {/* Chat Panel Overlay - Right Side */}
        {showChat && (
          <View style={styles.chatPanel}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
              <Text style={styles.chatHeaderText}>Live Chat</Text>
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{messages.length}</Text>
              </View>
            </View>

            {/* Messages */}
            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
              {messages.length === 0 ? (
                <View style={styles.emptyChat}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyChatText}>No messages yet</Text>
                  <Text style={styles.emptyChatSubtext}>Be the first to say something!</Text>
                </View>
              ) : (
                messages.map((msg) => (
                  <View key={msg.id} style={styles.messageItem}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageUser}>{msg.user}</Text>
                      <Text style={styles.messageTime}>{msg.timestamp}</Text>
                    </View>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.chatInputContainer}>
              <TouchableOpacity style={styles.imageButton}>
                <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <TextInput
                style={styles.chatInput}
                placeholder="Say something..."
                placeholderTextColor={COLORS.textMuted}
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
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
    ...SHADOWS.md,
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
    marginBottom: 4,
  },
  roomHost: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
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
  albumArtContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  albumArt: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.lg,
  },
  albumOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
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
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  albumName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  musicControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  controlButton: {
    padding: SPACING.md,
  },
  playButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsScroll: {
    marginBottom: SPACING.lg,
    maxHeight: 100,
  },
  reactions: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  reactionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
  },
  reactionEmoji: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  reactionLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  passMicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  passMicText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
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
    width: 280,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.sm,
  },
  chatHeaderText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  chatBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  chatBadgeText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
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
  messageItem: {
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  messageUser: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  messageTime: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
  },
  messageText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    lineHeight: 18,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: SPACING.sm,
  },
  imageButton: {
    padding: SPACING.xs,
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
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
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
    elevation: 5,
    zIndex: 1000,
  },
});

export default ListeningRoomScreen;
