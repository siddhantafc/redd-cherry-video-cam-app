
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BankIcon, MoneyIcon, ClockCounterClockwiseIcon } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { getToken } from '../../../utils/authStorage';


const HostMyPaymentSection = ({ navigation }) => {


  return (
    <View className="px-6 pt-4 pb-2">
      <View className="bg-white rounded-lg shadow">
        <Text className="text-sm font-semibold text-gray-800 px-4 py-2">My Payment</Text>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostBankDetails')}
        >
          <BankIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">Bank Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostWithdraw')}
        >
          <MoneyIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostWithdrawalHistory')}
        >
          <ClockCounterClockwiseIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">Withdrawal History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HostMyPaymentSection;
