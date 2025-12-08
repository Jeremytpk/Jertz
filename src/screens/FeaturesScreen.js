import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../config/theme';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  {
    id: '1',
    icon: 'musical-notes',
    title: 'Live Music Rooms',
    description: 'Create or join live listening rooms where everyone enjoys music together in real-time',
    gradient: GRADIENTS.primary,
  },
  {
    id: '2',
    icon: 'people',
    title: 'Listen Together',
    description: 'Host controls the music while participants listen live - perfect sync for everyone',
    gradient: GRADIENTS.secondary,
  },
  {
    id: '3',
    icon: 'images',
    title: 'Challenge Rooms',
    description: 'Compete with image challenges while enjoying synchronized music playback',
    gradient: GRADIENTS.accent,
  },
  {
    id: '4',
    icon: 'chatbubbles',
    title: 'Live Chat',
    description: 'Chat with other listeners in real-time and share your thoughts about the music',
    gradient: GRADIENTS.primary,
  },
  {
    id: '5',
    icon: 'heart',
    title: 'Quick Reactions',
    description: 'Express yourself with instant emoji reactions that everyone can see',
    gradient: GRADIENTS.secondary,
  },
  {
    id: '6',
    icon: 'cloud-upload',
    title: 'Upload Music',
    description: 'Share your favorite tracks with the community and build your music library',
    gradient: GRADIENTS.accent,
  },
];

const FeaturesScreen = ({ navigation, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < FEATURES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    if (onComplete) {
      onComplete();
    } else {
      // If called from navigation, just go back
      navigation.goBack();
    }
  };

  const renderFeature = ({ item, index }) => {
    const gradientColors = item.gradient || GRADIENTS.primary || ['#E21F26', '#7B2D8E'];
    
    return (
      <View style={styles.featureContainer}>
        <View style={styles.featureContent}>
          <LinearGradient
            colors={gradientColors}
            style={styles.iconContainer}
          >
            <Ionicons name={item.icon} size={80} color={COLORS.text} />
          </LinearGradient>
          
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Text style={styles.featureDescription}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {FEATURES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[COLORS.background || '#0A0A0A', COLORS.surface || '#1A1A1A']}
      style={styles.container}
    >
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Features List */}
      <FlatList
        ref={flatListRef}
        data={FEATURES}
        renderItem={renderFeature}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Dots Indicator */}
      {renderDots()}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <LinearGradient
            colors={GRADIENTS.primary || ['#E21F26', '#7B2D8E']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === FEATURES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name={currentIndex === FEATURES.length - 1 ? "checkmark" : "arrow-forward"}
              size={24}
              color={COLORS.text}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: SPACING.xl,
    zIndex: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  skipText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  featureContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  featureContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  featureTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  navigationContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  nextButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

export default FeaturesScreen;
