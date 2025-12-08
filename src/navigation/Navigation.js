import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import NowPlayingBar from '../components/NowPlayingBar';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import UploadScreen from '../screens/UploadScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyUploadsScreen from '../screens/MyUploadsScreen';
import FollowingScreen from '../screens/FollowingScreen';

// Room Screens
import ListeningRoomScreen from '../screens/room/ListeningRoomScreen';
import ChallengeRoomScreen from '../screens/room/ChallengeRoomScreen';
import CreateRoomScreen from '../screens/room/CreateRoomScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { isGuest } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.surfaceLight,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      {!isGuest && (
        <Tab.Screen name="Upload" component={UploadScreen} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const NavigationWithBar = () => {
  const { user, isGuest } = useAuth();
  
  // Get current route name
  const routeName = useNavigationState(state => {
    if (!state) return null;
    const route = state.routes[state.index];
    return route.name;
  });
  
  // Hide NowPlayingBar in room screens
  const hideNowPlaying = routeName === 'ListeningRoom' || routeName === 'ChallengeRoom';
  
  return (
    <>
      {(user || isGuest) && !hideNowPlaying && <NowPlayingBar />}
    </>
  );
};

const Navigation = () => {
  const { user, isGuest, loading } = useAuth();

  console.log('Navigation: Rendering with state:', { user: user?.uid, isGuest, loading });

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background },
          }}
        >
          {!user && !isGuest ? (
            // Auth Stack
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          ) : (
            // Main App Stack
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="MyUploads" component={MyUploadsScreen} />
              <Stack.Screen name="Following" component={FollowingScreen} />
              <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
              <Stack.Screen name="ListeningRoom" component={ListeningRoomScreen} />
              <Stack.Screen name="ChallengeRoom" component={ChallengeRoomScreen} />
            </>
          )}
        </Stack.Navigator>
        
        {/* Global Now Playing Bar - Hidden in room screens */}
        <NavigationWithBar />
      </View>
    </NavigationContainer>
  );
};

export default Navigation;
