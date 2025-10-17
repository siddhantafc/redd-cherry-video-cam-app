
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BookOpen } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { getToken } from '../../../utils/authStorage';


const HostMiscSection = ({ navigation }) => {


  return (
    <View className="px-6 pt-4 pb-2">
      <View className="bg-white rounded-lg shadow">
        <Text className="text-sm font-semibold text-gray-800 px-4 py-2">Miscellaneous</Text>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostAppGuide')}
        >
          <BookOpen size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">App Guide</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HostMiscSection;
