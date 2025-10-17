import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuth } from '../../../../contexts/AuthContext';
import { ArrowLeft } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';

export default function HostReportIssue({ navigation }) {
  const { token, user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('Host Report: ');
  const [body, setBody] = useState();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Missing info', 'Please enter a subject and message.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: email?.trim() || undefined, subject: subject.trim(), body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to send');
      }
      Alert.alert('Sent', 'Your report has been sent to customer care.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="px-4 pt-4">
          <View className="mb-2">
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HostMenu'))}
              className="flex-row items-center"
            >
              <ArrowLeft size={24} color="#111827" weight="bold" />
              <Text className="ml-2 text-gray-800">Back</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-semibold text-gray-800">Report an issue (Host)</Text>
          <Text className="text-gray-500 mt-1">We will forward this to customer care.</Text>

          <View className="mt-4 bg-white rounded-lg p-4 shadow">
            <Text className="text-sm text-gray-600">Your email (optional)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="mt-1 border border-gray-200 rounded px-3 py-2"
            />

            <Text className="text-sm text-gray-600 mt-3">Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief subject"
              className="mt-1 border border-gray-200 rounded px-3 py-2"
            />

            <Text className="text-sm text-gray-600 mt-3">Message</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Describe the issue..."
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              className="mt-1 border border-gray-200 rounded px-3 py-2"
              style={{ minHeight: 180 }}
            />

            <TouchableOpacity
              onPress={onSubmit}
              disabled={loading}
              className="mt-4 bg-purple-600 rounded items-center justify-center py-3"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Send Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
