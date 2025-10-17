import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { VideoCamera } from 'phosphor-react-native';

const UserCard = ({ user, onPress, onVideoCall }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'busy':
        return 'Busy';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(user)}
      className="bg-white rounded-lg p-4 mb-3 mx-4 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        {/* Profile Picture */}
        <View className="relative">
          {user.profilePictureUrl ? (
            <Image
              source={{ uri: user.profilePictureUrl }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-gray-600 font-semibold text-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          {/* Status Dot */}
          <View
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
              user.status || (user.is_online ? 'online' : 'offline')
            )}`}
          />
        </View>

        {/* User Info */}
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-semibold text-base">
            {user.username}
          </Text>
          <Text className={`text-xs font-medium ${
            user.status === 'online' || user.is_online 
              ? 'text-green-600' 
              : user.status === 'busy' 
                ? 'text-yellow-600' 
                : 'text-gray-500'
          }`}>
            {getStatusText(user.status || (user.is_online ? 'online' : 'offline'))}
          </Text>
        </View>

        {/* Call Button - Only show for online users */}
        {(user.status === 'online') && (
          <View className="flex-row">
            {/* Video Call Button */}
            <TouchableOpacity
              onPress={() => onVideoCall && onVideoCall(user)}
              className="flex-row items-center px-4 py-2 rounded-full bg-green-500 shadow-sm"
              activeOpacity={0.7}
            >
              <VideoCamera size={22} color="white" weight="fill" />
              <Text className="ml-2 text-white font-semibold text-sm">Call</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </TouchableOpacity>
  );
};

export default UserCard;
