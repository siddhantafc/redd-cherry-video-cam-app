import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Pressable, Image } from 'react-native';
import { RtcTextureView, VideoViewSetupMode } from 'react-native-agora';
import { 
  Phone, 
  PhoneX, 
  Microphone, 
  MicrophoneSlash, 
  Camera, 
  CameraSlash,
  SpeakerHigh,
  SpeakerSimpleSlash,
  CameraRotate
} from 'phosphor-react-native';

const VideoCallScreen = ({ 
  currentCall, 
  remoteUid, 
  isAudioEnabled, 
  isVideoEnabled, 
  isSpeakerEnabled,
  callDurationFormatted,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onToggleSpeaker,
  onSwitchCamera,
  engine,
  engineReady,
  remoteVideoReady
}) => {
  // Note: For local preview in RN Agora v4, uid 0 is a special local preview uid
  const localUid = 0;
  const [isLocalPrimary, setIsLocalPrimary] = useState(false);

  const swapPrimary = useCallback(() => setIsLocalPrimary(prev => !prev), []);

  const displayName = useMemo(() => (
    currentCall?.receiver?.name ||
    currentCall?.caller?.name ||
    currentCall?.receiver?.username ||
    currentCall?.caller?.username ||
    'Unknown'
  ), [currentCall]);

  const avatarLetter = useMemo(() => displayName.charAt(0).toUpperCase(), [displayName]);
  const remoteAvatar = useMemo(() => (
    currentCall?.receiver?.profilePictureUrl || currentCall?.caller?.profilePictureUrl || null
  ), [currentCall]);
  const connection = useMemo(() => (
    currentCall?.channelName ? { channelId: currentCall.channelName } : undefined
  ), [currentCall?.channelName]);

  // Log and ensure re-render paths when connection or remoteUid changes
  useEffect(() => {
    console.log('[VideoCallScreen] connection updated:', connection);
  }, [connection]);
  useEffect(() => {
    console.log('[VideoCallScreen] remoteUid updated:', remoteUid);
  }, [remoteUid]);
  useEffect(() => {
    console.log('[VideoCallScreen] engineReady:', engineReady, 'isVideoEnabled:', isVideoEnabled);
  }, [engineReady, isVideoEnabled]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Primary Video Area (swappable) */}
      <View className="flex-1 relative">
        <Pressable className="flex-1" onPress={swapPrimary}>
          {isLocalPrimary ? (
            isVideoEnabled && engineReady ? (
              <RtcTextureView
                key={`local-${connection?.channelId || 'none'}`}
                canvas={{ uid: localUid }}
                connection={connection}
                style={{ flex: 1 }}
                setupMode={VideoViewSetupMode.VideoViewSetupReplace}
                pointerEvents="none"
              />
            ) : (
              <View className="flex-1 bg-gray-800 items-center justify-center">
                <View className="w-32 h-32 bg-gray-600 rounded-full items-center justify-center mb-4">
                  <Camera size={40} color="white" />
                </View>
                <Text className="text-white text-xl font-semibold mb-2">Your camera is off</Text>
                <Text className="text-gray-300 text-base">Tap to switch view</Text>
              </View>
            )
          ) : (
            remoteUid && engineReady && remoteVideoReady ? (
              <RtcTextureView
                key={`remote-${connection?.channelId || 'none'}-${remoteUid}`}
                canvas={{ uid: remoteUid }}
                connection={connection}
                style={{ flex: 1 }}
                setupMode={VideoViewSetupMode.VideoViewSetupReplace}
                pointerEvents="none"
              />
            ) : (
              <View className="flex-1 bg-gray-800 items-center justify-center">
                {remoteAvatar ? (
                  <Image source={{ uri: remoteAvatar }} style={{ width: 128, height: 128, borderRadius: 9999, marginBottom: 16 }} />
                ) : (
                  <View className="w-32 h-32 bg-gray-600 rounded-full items-center justify-center mb-4">
                    <Text className="text-white text-3xl font-bold">{avatarLetter}</Text>
                  </View>
                )}
                <Text className="text-white text-xl font-semibold mb-2">You are</Text>
                <Text className="text-gray-300 text-base">{remoteUid ? 'Connecting...' : 'Calling...'}</Text>
              </View>
            )
          )}
        </Pressable>

        {/* Call Info Overlay */}
        <View className="absolute top-12 left-0 right-0 items-center" style={{ zIndex: 20 }}>
          <View className="bg-black/50 px-4 py-2 rounded-full">
            <Text className="text-white text-sm font-medium">
              {callDurationFormatted}
            </Text>
          </View>
        </View>

        {/* Small Preview (tap to swap) */}
        <TouchableOpacity
          onPress={swapPrimary}
          className="absolute top-20 right-4 w-32 h-40 bg-gray-700 rounded-xl overflow-hidden z-10"
          style={{ elevation: 10 }}
          activeOpacity={0.9}
        >
          {isLocalPrimary ? (
            remoteUid && engineReady && remoteVideoReady ? (
              <RtcTextureView
                key={`remote-mini-${connection?.channelId || 'none'}-${remoteUid}`}
                canvas={{ uid: remoteUid }}
                connection={connection}
                style={{ flex: 1 }}
                setupMode={VideoViewSetupMode.VideoViewSetupReplace}
                pointerEvents="none"
              />
            ) : (
              <View className="flex-1 bg-gray-600 items-center justify-center">
                {remoteAvatar ? (
                  <Image source={{ uri: remoteAvatar }} style={{ width: 96, height: 96, borderRadius: 9999 }} />
                ) : (
                  <Text className="text-white text-2xl font-bold">{avatarLetter}</Text>
                )}
              </View>
            )
          ) : (
            isVideoEnabled && engineReady ? (
              <RtcTextureView
                key={`local-mini-${connection?.channelId || 'none'}`}
                canvas={{ uid: localUid }}
                connection={connection}
                style={{ flex: 1 }}
                setupMode={VideoViewSetupMode.VideoViewSetupReplace}
                pointerEvents="none"
              />
            ) : (
              <View className="flex-1 bg-gray-600 items-center justify-center">
                <Camera size={28} color="white" />
              </View>
            )
          )}
        </TouchableOpacity>
      </View>

      {/* Call Controls */}
      <View className="absolute bottom-0 left-0 right-0 pb-12" style={{ zIndex: 30 }}>
        <View className="flex-row justify-center items-center space-x-6 px-8">
          
          {/* Mute Button */}
          <TouchableOpacity
            onPress={onToggleAudio}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              isAudioEnabled ? 'bg-gray-700/80' : 'bg-red-500'
            }`}
            activeOpacity={0.7}
          >
            {isAudioEnabled ? (
              <Microphone size={28} color="white" weight="fill" />
            ) : (
              <MicrophoneSlash size={28} color="white" weight="fill" />
            )}
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity
            onPress={onEndCall}
            className="w-20 h-20 bg-red-500 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <PhoneX size={32} color="white" weight="fill" />
          </TouchableOpacity>

          {/* Video Button */}
          <TouchableOpacity
            onPress={onToggleVideo}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              isVideoEnabled ? 'bg-gray-700/80' : 'bg-red-500'
            }`}
            activeOpacity={0.7}
          >
            {isVideoEnabled ? (
              <Camera size={28} color="white" weight="fill" />
            ) : (
              <CameraSlash size={28} color="white" weight="fill" />
            )}
          </TouchableOpacity>
        </View>

        {/* Secondary Controls */}
        <View className="flex-row justify-center items-center space-x-8 mt-6">
          
          {/* Speaker Button */}
          <TouchableOpacity
            onPress={onToggleSpeaker}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              isSpeakerEnabled ? 'bg-blue-500' : 'bg-gray-700/80'
            }`}
            activeOpacity={0.7}
          >
            {isSpeakerEnabled ? (
              <SpeakerHigh size={24} color="white" weight="fill" />
            ) : (
              <SpeakerSimpleSlash size={24} color="white" weight="fill" />
            )}
          </TouchableOpacity>

          {/* Camera Switch Button */}
          <TouchableOpacity
            onPress={onSwitchCamera}
            className="w-12 h-12 bg-gray-700/80 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <CameraRotate size={24} color="white" weight="fill" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VideoCallScreen;
