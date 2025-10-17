// Debug component to test Agora credentials loading
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { AGORA_APP_ID, AGORA_APP_CERTIFICATE, API_BASE_URL } from '@env';
import { createAgoraRtcEngine } from 'react-native-agora';

const AgoraDebugTest = () => {
  useEffect(() => {
    console.log('🔍 AGORA DEBUG TEST - Environment Variables:');
    console.log('  API_BASE_URL:', API_BASE_URL);
    console.log('  AGORA_APP_ID:', AGORA_APP_ID);
    console.log('  AGORA_APP_ID length:', AGORA_APP_ID?.length);
    console.log('  AGORA_APP_ID type:', typeof AGORA_APP_ID);
    console.log('  AGORA_APP_CERTIFICATE:', AGORA_APP_CERTIFICATE?.substring(0, 8) + '...');
    console.log('  AGORA_APP_CERTIFICATE length:', AGORA_APP_CERTIFICATE?.length);
  }, []);

  const testAgoraInitialization = async () => {
    try {
      console.log('🧪 Testing Agora Engine Creation...');
      
      if (!AGORA_APP_ID) {
        throw new Error('AGORA_APP_ID is not loaded from environment');
      }

      const engine = createAgoraRtcEngine();
      console.log('✅ Agora engine created successfully');

      const result = await engine.initialize({
        appId: AGORA_APP_ID.trim(),
      });

      console.log('✅ Agora engine initialized with result:', result);
      
      // Clean up
      await engine.release();
      console.log('✅ Agora engine released');

      Alert.alert('Success', 'Agora initialization test passed!');
    } catch (error) {
      console.error('❌ Agora initialization test failed:', error);
      Alert.alert('Error', `Agora test failed: ${error.message}`);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: 'white', margin: 20, borderRadius: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Agora Debug Test
      </Text>
      
      <Text>App ID: {AGORA_APP_ID || 'NOT LOADED'}</Text>
      <Text>App ID Length: {AGORA_APP_ID?.length || 'N/A'}</Text>
      <Text>Certificate: {AGORA_APP_CERTIFICATE ? 'LOADED' : 'NOT LOADED'}</Text>
      
      <TouchableOpacity
        onPress={testAgoraInitialization}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginTop: 20,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Agora Initialization
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AgoraDebugTest;
