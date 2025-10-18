import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
// Import the logo image
import logo from '../../../assets/images/friendsclub_logo_512.png';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../utils/authStorage';
import { useWalletBalance } from '../../../contexts/WalletBalanceContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye, EyeSlash, UserPlus } from 'phosphor-react-native';
import CopyrightFooter from '../../../components/common/CopyrightFooter';

export default function LoginScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshBalance } = useWalletBalance();
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Bhai, code detects if input has @ for email lol
      let loginPayload = { password };
      if (/^\d{10,15}$/.test(emailOrPhone)) {
        loginPayload.phone = emailOrPhone;
      } else if (emailOrPhone.includes('@')) {
        loginPayload.email = emailOrPhone;
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        // Save auth data to storage
        if (data.token && data.user) {
          await login(data.token, data.user);
          try { await refreshBalance(); } catch (e) { /* silent */ }
          // RootNavigator will switch stack based on role
        }
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={24}
      >
        <Image
          source={logo}
          style={{ width: 100, height: 100, marginBottom: 24 }}
          resizeMode="contain"
          accessibilityLabel="Let's Talk Logo"
        />
        <Text className="text-3xl font-bold text-primary mb-8">Login</Text>
        <TextInput
          className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-black"
          placeholder="Email or Phone"
          placeholderTextColor="#aaa"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {/* Password with toggle */}
        <View className="w-full mb-6 relative">
          <TextInput
            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 text-black"
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
        {error ? (
          <Text className="text-red-500 mb-2">{error}</Text>
        ) : null}
        <TouchableOpacity
          className="w-full bg-primary py-3 rounded-lg items-center shadow-md active:opacity-80"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Login</Text>
          )}
        </TouchableOpacity>
        <Text className="text-gray-600 mt-4">or</Text>
        <View className="w-full mt-2 items-center">
          <Text className="text-gray-600 mb-2">Don't have an account?</Text>
          <TouchableOpacity
            className="w-full bg-pink-600 py-3 rounded-xl items-center justify-center shadow-lg active:opacity-90 flex-row"
            onPress={() => navigation.navigate('Signup')}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
          >
            <UserPlus size={20} color="#fff" weight="fill" />
            <View style={{ width: 8 }} />
            <Text className="text-white text-lg font-semibold tracking-wide">Create your account</Text>
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-2">It's free and takes less than a minute</Text>
        </View>
      </KeyboardAwareScrollView>
      <CopyrightFooter />
    </View>
  );
}
