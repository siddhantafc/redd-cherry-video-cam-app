import React from 'react';
import { View, Platform } from 'react-native';
import * as Application from 'expo-application';
import UserSignupScreen from './users/UserSignupScreen';
import HostSignupScreen from './hosts/HostSignupScreen';

export default function SignupScreen({ navigation }) {
  // Decide which signup to show based on Android flavor package name
  // On Android: com.reddcherry.host or com.reddcherry.user
  // On iOS/web (no flavors): default to user
  const isHost = Platform.OS === 'android' && Application.applicationId === 'com.reddcherry.host';

  return (
    <View className="flex-1 bg-white pt-8">
      <View className="flex-1">
        {isHost ? (
          <HostSignupScreen navigation={navigation} />
        ) : (
          <UserSignupScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
}
