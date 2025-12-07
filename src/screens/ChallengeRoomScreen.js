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
import { CHALLENGE_IMAGE_SIZE } from '../config/constants';

const { width, height } = Dimensions.get('window');

const ChallengeRoomScreen = ({ navigation, route }) => {
  const { roomId } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'John', message: 'HAHA that baby photo! 😂', timestamp: '10:30 AM' },
    { id: 2, user: 'Sarah', message: 'Vote for #3!', timestamp: '10:31 AM' },
  ]);

  // Mock challenge data
  const [images, setImages] = useState([
    { id: 1, user: 'John', uri: 'https://via.placeholder.com/500', votes: 12, rank: 1 },
    { id: 2, user: 'Sarah', uri: 'https://via.placeholder.com/500', votes: 8, rank: 2 },
    { id: 3, user: 'Mike', uri: 'https://via.placeholder.com/500', votes: 5, rank: 3 },
    { id: 4, user: 'Emma', uri: 'https://via.placeholder.com/500', votes: 3, rank: 4 },
  ]);

  const handleVote = (imageId) => {
    setImages(images.map(img => 
      img.id === imageId ? { ...img, votes: img.votes + 1 } : img
    ).sort((a, b) => b.votes - a.votes).map((img, index) => ({ ...img, rank: index + 1 })));
  };

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

  const currentImage = images[currentImageIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle}>Best Baby Photo Challenge 👶</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>25 playing</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={28} color={COLORS.text} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.mainContent}>
        {/* Top/Center: Challenge Canvas */}
        <View style={styles.challengeSection}>
          {/* Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            style={styles.carouselScroll}
          >
            {images.map((image, index) => (
              <View key={image.id} style={styles.imageSlide}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleVote(image.id)}
                  style={styles.imageContainer}
                >
                  {/* Rank Border */}
                  {image.rank === 1 && (
                    <View style={[styles.rankBorder, styles.goldBorder]} />
                  )}
                  {image.rank === 2 && (
                    <View style={[styles.rankBorder, styles.silverBorder]} />
                  )}

                  <Image
                    source={{ uri: image.uri }}
                    style={styles.challengeImage}
                  />

                  {/* Vote Overlay */}
                  <View style={styles.imageOverlay}>
                    <View style={styles.userBadge}>
                      <Text style={styles.userName}>{image.user}</Text>
                    </View>
                    <View style={styles.voteBadge}>
                      <Ionicons name="heart" size={20} color={COLORS.error} />
                      <Text style={styles.voteCount}>{image.votes}</Text>
                    </View>
                  </View>

                  {/* Rank Badge */}
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{image.rank}</Text>
                  </View>

                  {/* Double-tap hint */}
                  <View style={styles.voteHint}>
                    <Ionicons name="heart" size={40} color={COLORS.error} style={styles.voteHintIcon} />
                    <Text style={styles.voteHintText}>Double-tap to vote</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Carousel Dots */}
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentImageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Leaderboard */}
          <View style={styles.leaderboard}>
            <Text style={styles.leaderboardTitle}>🏆 Top 3</Text>
            <View style={styles.leaderboardItems}>
              {images.slice(0, 3).map((image, index) => (
                <View key={image.id} style={styles.leaderboardItem}>
                  <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                  <Image source={{ uri: image.uri }} style={styles.leaderboardImage} />
                  <Text style={styles.leaderboardUser}>{image.user}</Text>
                  <View style={styles.leaderboardVotes}>
                    <Ionicons name="heart" size={14} color={COLORS.error} />
                    <Text style={styles.leaderboardVoteCount}>{image.votes}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Mini Music Player */}
          <View style={styles.miniPlayer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }}
              style={styles.miniAlbumArt}
            />
            <View style={styles.miniTrackInfo}>
              <Text style={styles.miniTrackTitle} numberOfLines={1}>
                Track Name
              </Text>
              <Text style={styles.miniArtist} numberOfLines={1}>
                Artist Name
              </Text>
            </View>
            <TouchableOpacity style={styles.miniPlayButton}>
              <Ionicons name="pause" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Chat Panel */}
        <View style={styles.chatSection}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.primary} />
            <Text style={styles.chatHeaderText}>Chat</Text>
          </View>

          {/* Messages */}
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {messages.map((msg) => (
              <View key={msg.id} style={styles.messageItem}>
                <View style={styles.messageHeader}>
                  <Text style={styles.messageUser}>{msg.user}</Text>
                  <Text style={styles.messageTime}>{msg.timestamp}</Text>
                </View>
                <Text style={styles.messageText}>{msg.message}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.messageInput}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Ionicons name="send" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    marginRight: SPACING.xs,
  },
  liveText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    opacity: 0.8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  challengeSection: {
    flex: 2,
    padding: SPACING.lg,
  },
  carouselScroll: {
    marginBottom: SPACING.md,
  },
  imageSlide: {
    width: width * 0.65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: CHALLENGE_IMAGE_SIZE,
    height: CHALLENGE_IMAGE_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  rankBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BORDER_RADIUS.lg + 4,
    borderWidth: 4,
    zIndex: 1,
  },
  goldBorder: {
    borderColor: COLORS.gold,
  },
  silverBorder: {
    borderColor: COLORS.silver,
  },
  challengeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  userName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  voteBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs,
  },
  voteCount: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rankBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  voteHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  voteHintIcon: {
    opacity: 0.3,
  },
  voteHintText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginTop: SPACING.xs,
    opacity: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  leaderboard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  leaderboardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  leaderboardItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leaderboardItem: {
    alignItems: 'center',
  },
  leaderboardRank: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  leaderboardImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: SPACING.xs,
  },
  leaderboardUser: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  leaderboardVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  leaderboardVoteCount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  miniPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  miniAlbumArt: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  miniTrackInfo: {
    flex: 1,
  },
  miniTrackTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  miniArtist: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  miniPlayButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSection: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.surfaceLight,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    gap: SPACING.sm,
  },
  chatHeaderText: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  messagesContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  messageItem: {
    marginBottom: SPACING.md,
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
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChallengeRoomScreen;
