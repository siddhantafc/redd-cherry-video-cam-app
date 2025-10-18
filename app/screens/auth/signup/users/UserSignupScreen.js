import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Alert } from 'react-native';
import { API_BASE_URL } from '@env';
import logo from '../../../../assets/images/friendsclub_logo_512.png';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CopyrightFooter from "../../../../components/common/CopyrightFooter";
import { Eye, EyeSlash } from 'phosphor-react-native';

export default function UserSignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  const handleSignUp = async () => {
    if (!email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      // For user signup, backend expects: email, name, gender, phone, password
      // We'll use email as name, and gender as 'other' for now (since not in form)
      const payload = {
        email,
        name: email,
        gender: 'other',
        phone,
        password,
      };
      const response = await fetch(`${API_BASE_URL}/api/auth/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {}
      if (response.ok) {
        // Do NOT auto-login. Redirect user to Login for consistent behavior.
        Alert.alert('Success', 'Registration successful. Please log in to continue.', [
          {
            text: 'Go to Login',
            onPress: () => {
              try {
                // Reset navigation so back button doesn't return to signup
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              } catch {
                navigation.navigate('Login');
              }
            },
          },
        ]);
      } else if (response.status === 409) {
        Alert.alert('Error', data.message || 'User with this email or phone already exists');
      } else if (response.status === 400) {
        Alert.alert('Invalid Input', data.message || 'Please check your input and try again.');
      } else {
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: 'white' }}
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={24}
    >
      <Image
        source={logo}
        style={{ width: 100, height: 100}}
        resizeMode="contain"
        accessibilityLabel="Let's Talk Logo"
      />
      <Text className="text-3xl font-bold text-primary mb-2">User Sign Up</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} className="mb-6">
        <Text className="text-primary text-base">Already have an account? <Text className="text-pink-500 underline">Sign in</Text></Text>
      </TouchableOpacity>
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Phone"
        placeholderTextColor="#aaa"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      {/* Password with toggle */}
      <View className="w-full mb-4 relative">
        <TextInput
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <View className="absolute right-3 inset-y-0 justify-center">
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            className="p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeSlash size={22} color="#6b7280" weight="regular" />
            ) : (
              <Eye size={22} color="#6b7280" weight="regular" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password with toggle */}
      <View className="w-full mb-2 relative">
        <TextInput
          className={`w-full px-4 py-3 pr-12 border rounded-lg bg-gray-50 text-base text-gray-900 ${!passwordsMatch ? 'border-red-400' : 'border-gray-200'}`}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <View className="absolute right-3 inset-y-0 justify-center">
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((v) => !v)}
            accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            className="p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showConfirmPassword ? (
              <EyeSlash size={22} color="#6b7280" weight="regular" />
            ) : (
              <Eye size={22} color="#6b7280" weight="regular" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {!passwordsMatch && (
        <Text className="w-full text-red-500 mb-2 text-sm">Passwords do not match</Text>
      )}
      <TouchableOpacity
        className="w-full bg-primary py-3 rounded-lg items-center shadow-md active:opacity-80 mb-4"
        disabled={!passwordsMatch}
        onPress={handleSignUp}
      >
        <Text className="text-white text-lg font-semibold">Sign Up</Text>
      </TouchableOpacity>
      <CopyrightFooter />
    </KeyboardAwareScrollView>
    
  );
}
