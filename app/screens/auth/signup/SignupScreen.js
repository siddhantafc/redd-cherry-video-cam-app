
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UserSignupScreen from './users/UserSignupScreen';
import HostSignupScreen from './hosts/HostSignupScreen';
import SignupTab from '../../../components/signup/SignupTab';

export default function SignupScreen({ navigation }) {
  const [tab, setTab] = useState('user');

  return (
    <View className="flex-1 bg-white pt-8">
  <SignupTab tab={tab} setTab={setTab} />
      <View className="flex-1">
        {tab === 'user' ? (
          <UserSignupScreen navigation={navigation} />
        ) : (
          <HostSignupScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
}
