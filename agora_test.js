// Simple Agora test to verify configuration
// Run this in your React Native app to test basic connection

import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';

const TEST_AGORA_CONFIGURATION = async () => {
  const APP_ID = 'e65d5021e1e647c8b426780558500942';
  const TEST_CHANNEL = 'test_channel_123';
  const TEST_UID = 12345;
  
  // Test without token first (if project allows)
  console.log('🧪 Testing Agora without token...');
  
  try {
    const engine = createAgoraRtcEngine();
    
    // Initialize
    const initResult = engine.initialize({
      appId: APP_ID,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
    
    console.log('✅ Engine initialized:', initResult);
    
    // Try to join without token (only works in testing mode)
    try {
      const joinResult = await engine.joinChannel(null, TEST_CHANNEL, TEST_UID, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      
      console.log('✅ Joined without token:', joinResult);
      console.log('🎉 Your Agora project is in TESTING mode - tokens not required');
      
      // Leave channel
      engine.leaveChannel();
      
    } catch (noTokenError) {
      console.log('❌ Cannot join without token:', noTokenError);
      console.log('🔒 Your Agora project requires tokens (secured mode)');
    }
    
    engine.release();
    
  } catch (error) {
    console.error('❌ Agora test failed:', error);
  }
};

// To use this test, call it in your component:
// TEST_AGORA_CONFIGURATION();

export default TEST_AGORA_CONFIGURATION;
