import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SPACING, FONTS, BORDER_RADIUS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const WelcomeScreen = ({ navigation }) => {
  const { continueAsGuest } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGuestMode = async () => {
    const result = await continueAsGuest();
    if (result.success) {
      // Navigation will happen automatically via AuthContext
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.primary} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logoOnly.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>The Social Music Platform</Text>
        </View>

        {/* Main CTA */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I Have an Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGuestMode}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featureText}>🎵 Listen Together, Real-Time</Text>
          <Text style={styles.featureText}>🎮 Play Music Challenges</Text>
          <Text style={styles.featureText}>💬 Connect with Friends</Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>The Audio Hangout</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl * 2,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: SPACING.lg,
    borderRadius: 15,

  },
  tagline: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.text,
    fontWeight: '600',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: COLORS.text,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.text,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  },
  guestText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    textDecorationLine: 'underline',
  },
  featuresContainer: {
    alignItems: 'center',
  },
  featureText: {
    color: COLORS.text,
    fontSize: FONTS.sizes.md,
    marginVertical: SPACING.xs,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.text,
    fontSize: FONTS.sizes.sm,
    paddingBottom: SPACING.xl,
    opacity: 0.7,
  },
});

export default WelcomeScreen;
