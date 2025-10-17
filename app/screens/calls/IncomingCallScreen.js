import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Image, Vibration } from 'react-native';
import { Phone, PhoneX } from 'phosphor-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Audio } from 'expo-av';

const IncomingCallScreen = ({ 
  incomingCall, 
  onAccept, 
  onReject 
}) => {
  if (!incomingCall) return null;

  // Basic viewer and caller context
  const caller = incomingCall.caller || {};
  const { roleId: viewerRoleId } = useAuth();
  const viewerIsHost = (viewerRoleId === '1' || viewerRoleId === 1);

  // Username helpers with robust fallbacks
  const extractUsername = (u) => {
    const uname = u?.username ?? u?.userName ?? u?.handle ?? u?.user_handle;
    if (typeof uname === 'string' && uname.trim().length > 0) return uname.trim();
    if (typeof u?.email === 'string' && u.email.includes('@')) {
      const local = u.email.split('@')[0];
      if (local) return local.trim();
    }
    if (u?.id) {
      const idStr = String(u.id);
      return `FUSR${idStr.slice(-6)}`;
    }
    return null;
  };
  const safeUsername = (u) => {
    const uname = extractUsername(u);
    return uname ? `@${uname}` : 'Unknown';
  };

  // What to show:
  // - If viewer is host (role 1), show the user's @username
  // - If viewer is user (role 2), show host's name if available, else @username
  const callerName = (typeof caller?.name === 'string' && caller.name.trim().length > 0) ? caller.name.trim() : null;
  const callerAt = safeUsername(caller);
  const titleText = viewerIsHost ? callerAt : (callerName || callerAt);
  const titleColorClass = viewerIsHost ? 'text-red-500' : 'text-blue-500';

  // Image and texts (show blurred profile only on user screen)
  const hostImage = !viewerIsHost
    ? (caller?.profilePictureUrl || caller?.profileUrl || caller?.avatarUrl || caller?.photoUrl || caller?.imageUrl || null)
    : null;
  const callTypeText = incomingCall.callType === 'video' ? 'Video Call' : 'Voice Call';
  const displayInitial = (titleText?.replace(/^@/, '').charAt(0) || '?').toUpperCase();

  // Ringtone setup
  const soundRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const startRingtone = async () => {
      try {
        console.log('[IncomingCallScreen] Setting audio mode and starting ringtone');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const source = require('../../assets/ringtone/ringtone.mp3');
        const { sound } = await Audio.Sound.createAsync(source, { isLooping: true, volume: 1.0 });
        if (!isMounted) return;
        soundRef.current = sound;
        console.log('[IncomingCallScreen] Ringtone sound loaded, attempting to play');
        await sound.playAsync();
        console.log('[IncomingCallScreen] Ringtone playing');
        // Start vibration in a repeating pattern alongside the ringtone
        try { Vibration.vibrate([0, 600, 800], true); } catch {}
      } catch (e) {
        console.warn('[IncomingCallScreen] Ringtone failed to start', e);
        // Optional haptic fallback so user still gets an alert
        try { Vibration.vibrate([0, 600, 800], true); } catch {}
      }
    };

    startRingtone();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      try { Vibration.cancel(); } catch {}
    };
    // Restart ringtone if a new incoming call object arrives
  }, [incomingCall?.id, incomingCall?.callId]);

  const stopRingtone = () => {
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    try { Vibration.cancel(); } catch {}
  };

  const handleAccept = () => {
    stopRingtone();
    onAccept && onAccept();
  };

  const handleReject = () => {
    stopRingtone();
    onReject && onReject();
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-900 to-blue-600">
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      {/* Background: Large blurred host profile picture on user screen (blue title) */}
      {!viewerIsHost && hostImage && (
        <View className="absolute inset-0 z-0" pointerEvents="none">
          <Image
            source={{ uri: hostImage }}
            className="absolute inset-0 w-full h-full"
            blurRadius={20}
            resizeMode="cover"
          />
          {/* Dark overlay for legibility */}
          <View className="absolute inset-0 bg-black/40" />
        </View>
      )}

      <View className="flex-1 items-center justify-center px-8 z-10">
        
        {/* Incoming Call Label */}
        <Text className="text-gray-900 text-lg font-medium mb-4">
          Incoming {callTypeText}
        </Text>

        {/* Caller Avatar */}
        <View className="mb-8">
          {hostImage ? (
            <Image
              source={{ uri: hostImage }}
              className="w-40 h-40 rounded-full border-4 border-white/20"
            />
          ) : (
            <View className="w-40 h-40 rounded-full bg-white/20 border-4 border-white/20 items-center justify-center">
              <Text className="text-gray-900 text-6xl font-bold">{displayInitial}</Text>
            </View>
          )}
        </View>

        {/* Caller Info */}
        <View className="items-center mb-16">
          <Text className={`${titleColorClass} text-2xl font-bold mb-2`}>{titleText}</Text>
        </View>

        {/* Call Actions */}
        <View className="flex-row items-center justify-between w-full max-w-xs">
          
          {/* Reject Button */}
          <TouchableOpacity
            onPress={handleReject}
            className="w-20 h-20 bg-red-500 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <PhoneX size={32} color="white" weight="fill" />
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            onPress={handleAccept}
            className="w-20 h-20 bg-green-500 rounded-full items-center justify-center shadow-lg"
            activeOpacity={0.8}
          >
            <Phone size={32} color="white" weight="fill" />
          </TouchableOpacity>
        </View>

        {/* Call Type Badge */}
        <View className="absolute top-16 self-center">
          <View className="bg-white/20 px-4 py-2 rounded-full">
            <Text className="text-gray-900 text-sm font-medium">
              {callTypeText}
            </Text>
          </View>
        </View>
      </View>

      {/* Background circles removed in favor of blurred profile backdrop */}
    </SafeAreaView>
  );
};

export default IncomingCallScreen;
