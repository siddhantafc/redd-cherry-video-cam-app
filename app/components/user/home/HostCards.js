import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VideoCamera, Eye, Crown } from 'phosphor-react-native';
import { useWalletBalance } from '../../../contexts/WalletBalanceContext';

const statusStyles = {
  online: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  busy: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
  },
  offline: {
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-600',
  },
};

const getStatusKey = (host) => {
  if (host?.status) return host.status;
  return host?.is_online ? 'online' : 'offline';
};

const getInitials = (name, username) => {
  const base = name || username || '';
  const parts = base.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export default function HostCard({ host, onPress, onVideoCall }) {
  const navigation = useNavigation();
  const statusKey = getStatusKey(host);
  const style = statusStyles[statusKey] || statusStyles.offline;
  const isPremium = !!(host?.is_premium ?? host?.premium);
  const { isUserRole, balanceSeconds } = useWalletBalance();
  const isRechargeMode = isUserRole && Number(balanceSeconds) <= 0;

  // Pulse animation for Recharge state
  const pulseAnim = useRef(new Animated.Value(1));
  useEffect(() => {
    let loop;
    if (isRechargeMode) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim.current, {
            toValue: 1.06,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim.current, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      // reset when not in recharge mode
      pulseAnim.current.setValue(1);
    }
    return () => {
      try { loop && loop.stop && loop.stop(); } catch {}
    };
  }, [isRechargeMode]);

  const maskPhone = (value) => {
    if (!value) return '';
    let masked = '';
    let digitsSeen = 0;
    for (let i = value.length - 1; i >= 0; i--) {
      const ch = value[i];
      if (/[0-9]/.test(ch)) {
        if (digitsSeen < 4) {
          masked = '*' + masked;
        } else {
          masked = ch + masked;
        }
        digitsSeen++;
      } else {
        masked = ch + masked;
      }
    }
    return masked;
  };

  const phoneMasked = maskPhone(host?.phone || host?.phoneNumber);

  return (
    <TouchableOpacity
      onPress={() => (onPress ? onPress(host) : navigation.navigate('HostProfile', { host }))}
      activeOpacity={0.85}
      className="relative mx-4 mb-4 rounded-2xl bg-white border border-gray-100 shadow-sm"
    >
      {isPremium ? (
        <View className="absolute right-3 top-0" style={{ transform: [{ translateY: -10 }] }}>
          <View className="flex-row items-center bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
            <Crown size={12} color="#b45309" weight="fill" />
            <Text className="ml-1 text-xs font-semibold text-amber-700">Premium</Text>
          </View>
        </View>
      ) : null}
      <View className="flex-row items-center p-4">
        {/* Avatar container */}
        <View className="relative">
          {host?.profilePictureUrl ? (
            <Image source={{ uri: host.profilePictureUrl }} className="w-24 h-24 rounded-2xl" />
          ) : (
            <View className="w-24 h-24 rounded-2xl bg-gray-200 items-center justify-center">
              <Text className="text-gray-700 font-semibold text-lg">
                {getInitials(host?.name, host?.username)}
              </Text>
            </View>
          )}
          <View className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${style.dot}`} />
        </View>

        {/* Info container (name, phone, status, call) */}
        <View className="flex-1 ml-4">
          <Text className="text-gray-900 font-semibold text-sm capitalize" numberOfLines={1}>
            {host?.name.toLowerCase()}
          </Text>
          <Text className="text-gray-400 font-normal text-xs" numberOfLines={1}>
            {host?.username}
          </Text>
          {phoneMasked ? (
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {phoneMasked}
            </Text>
          ) : null}

          {/* Actions: View + Call */}
          <View className="mt-2 flex-row items-center">
            <TouchableOpacity
              onPress={() => (onPress ? onPress(host) : navigation.navigate('HostProfile', { host }))}
              className="self-start flex-row items-center px-3.5 py-2 rounded-xl bg-pink-50 border border-pink-200"
              activeOpacity={0.8}
            >
              <Eye size={20} className="text-pink-700" weight="bold" />
              <Text className="ml-2 font-semibold text-sm text-pink-700">View</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!isRechargeMode && statusKey !== 'online'}
              onPress={() => {
                if (isRechargeMode) {
                  navigation.navigate('UserRecharge');
                } else if (onVideoCall) {
                  onVideoCall(host);
                }
              }}
              className={`ml-2 self-start flex-row items-center px-3.5 py-2 rounded-xl ${
                isRechargeMode
                  ? 'bg-indigo-600'
                  : statusKey === 'online' 
                    ? 'bg-emerald-500' 
                    : 'bg-gray-200'
              }`}
              style={isRechargeMode ? { transform: [{ scale: pulseAnim.current }] } : undefined}
              activeOpacity={0.8}
            >
              { !isRechargeMode && (
                <VideoCamera size={20} color={statusKey === 'online' ? 'white' : '#6b7280'} weight="fill" />
              )}
              <Text className={`ml-2 font-semibold text-sm ${
                isRechargeMode || statusKey === 'online' ? 'text-white' : 'text-gray-600'
              }`}>
                {isRechargeMode ? 'Recharge' : 'Call'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
