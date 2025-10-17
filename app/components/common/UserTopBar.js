import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { Wallet } from 'phosphor-react-native';
import { useWalletBalance } from '../../contexts/WalletBalanceContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';


// Reusable hint pill shown before the wallet when balance is low/zero
const BalanceHint = React.memo(({ balanceSeconds }) => {
  const secs = Number(balanceSeconds) || 0;
  if (secs <= 0) {
    return (
      <View className="mr-3 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
        <Text
          className="text-red-700 font-medium text-xs"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Recharge now to call
        </Text>
      </View>
    );
  }
  if (secs < 50) {
    return (
      <View className="mr-3 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
        <Text
          className="text-amber-700 font-medium text-xs"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          You have low balance
        </Text>
      </View>
    );
  }
  return null;
});


const UserTopBar = () => {
  const { formattedBalance, isUserRole, balanceSeconds, refreshBalance } = useWalletBalance();
  const navigation = useNavigation();
  console.log('UserTopBar rendered. formattedBalance:', formattedBalance);

  // Ensure balance refreshes when returning to any screen showing this top bar
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await refreshBalance();
        } catch {}
      })();
      return () => {
        cancelled = true;
      };
    }, [refreshBalance])
  );

  return (
    <View className="flex-row items-center justify-between bg-primary px-4 py-3 border-b border-gray-200">
      <Image
        source={require('../../assets/images/FM_512.webp')}
        className="rounded-md"
        style={{ width: 48, height: 48 }}
        resizeMode="contain"
      />
      {isUserRole ? (
        <View className="flex-row items-center">
          {/* Balance hints to the left of wallet */}
          <BalanceHint balanceSeconds={balanceSeconds} />

          {/* Wallet pill (press to navigate to Recharge) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('UserRecharge')}
            className="flex-row items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200"
          >
            <Wallet size={28} color="#374151" weight="bold" />
            <Text className="ml-1 text-gray-800 font-medium">{formattedBalance}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export default UserTopBar;
