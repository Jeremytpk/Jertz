import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../../config/theme';
import { CHALLENGE_IMAGE_SIZE } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const ChallengeRoomScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(true);
  const [lastTap, setLastTap] = useState(null);
  
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle} numberOfLines={1}>Best Baby Photo Challenge 👶</Text>
          <Text style={styles.roomHost}>
            Hosted by {user?.displayName ? `@${user.displayName}` : '@user'}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

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
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.miniAlbumArt}
            />
            <View style={styles.miniPlayerInfo}>
              <Text style={styles.miniTrackTitle} numberOfLines={1}>Current Track</Text>
              <Text style={styles.miniArtistName} numberOfLines={1}>Artist Name</Text>
            </View>
            <TouchableOpacity style={styles.miniPlayButton}>
              <Ionicons name="pause-circle" size={36} color={COLORS.primary} />
            </TouchableOpacity>
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
                <Text style={styles.participantsText}>12</Text>
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
  miniPlayButton: {
    marginLeft: SPACING.md,
  },
  // Chat Panel
  chatPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    paddingTop: 90,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
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
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
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
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
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

export default ChallengeRoomScreen;
