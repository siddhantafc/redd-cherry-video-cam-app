import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { House, Chat, List } from 'phosphor-react-native';

const ICON_SIZE = 28;

const HostBottomBar = ({ navigation, activeTab }) => {
  return (
    <View className="flex-row justify-around items-center bg-white border-t border-gray-200 py-2">
      <TouchableOpacity
        className="flex-1 items-center"
        onPress={() => navigation.navigate('HostHome')}
      >
        <House size={ICON_SIZE} color={activeTab === 'Home' ? '#6366f1' : '#9ca3af'} weight={activeTab === 'Home' ? 'fill' : 'regular'} />
        <Text className={`text-xs mt-1 ${activeTab === 'Home' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 items-center"
        onPress={() => navigation.navigate('HostMenu')}
      >
        <List size={ICON_SIZE} color={activeTab === 'Menu' ? '#6366f1' : '#9ca3af'} weight={activeTab === 'Menu' ? 'fill' : 'regular'} />
        <Text className={`text-xs mt-1 ${activeTab === 'Menu' ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HostBottomBar;
