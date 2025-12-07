import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../../config/theme';
import { VOICE_REACTIONS } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const ListeningRoomScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [activeReactions, setActiveReactions] = useState([]);

  const handleVoiceReaction = (reaction) => {
    // TODO: Play sound and broadcast to room
    console.log('Voice reaction:', reaction);
    
    // Create animated reaction
    const reactionId = Date.now() + Math.random();
    const startX = Math.random() * (width - 100);
    const animatedValue = new Animated.Value(0);
    
    const newReaction = {
      id: reactionId,
      emoji: reaction.emoji,
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle}>Friday Night Vibes 🎵</Text>
          <Text style={styles.roomHost}>
            Hosted by {user?.displayName ? `@${user.displayName}` : '@user'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.mainContent}>
        {/* Left: Album Art & Info */}
        <View style={styles.musicSection}>
          {/* Album/Artist Poster */}
          <View style={styles.posterContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Artist+Poster' }}
              style={styles.posterImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.posterOverlay}
            />
            {/* Track info overlay on poster */}
            <View style={styles.posterInfo}>
              <Text style={styles.posterTrackTitle}>Track Name Here</Text>
              <Text style={styles.posterArtistName}>Artist Name</Text>
            </View>
          </View>

          {/* Player Controls */}
          <View style={styles.playerControls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="play-skip-back" size={32} color={COLORS.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
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

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressTime}>1:23</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%' }]} />
            </View>
            <Text style={styles.progressTime}>3:45</Text>
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
            <Text style={styles.listenerText}>12</Text>
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
    width: width * 0.45,
    height: width * 0.65,
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
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    marginHorizontal: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
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
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
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
});

export default ListeningRoomScreen;
