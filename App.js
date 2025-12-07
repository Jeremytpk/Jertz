import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { MusicProvider } from './src/contexts/MusicContext';
import Navigation from './src/navigation/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Navigation />
        <StatusBar style="light" />
      </MusicProvider>
    </AuthProvider>
  );
}
