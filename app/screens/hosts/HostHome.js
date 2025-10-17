import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import UserCard from '../../components/common/UserCard';
import HostBottomBar from '../../components/common/HostBottomBar';
import HostTopBar from '../../components/common/HostTopBar';
import AuthenticatedScreenWrapper from '../../components/AuthenticatedScreenWrapper';
import { useUsers } from '../../hooks/useUsers';
import { AuthStorage } from '../../utils/authStorage';
import { useVideoCallContext } from '../../hooks/useVideoCallContext';

function HostHomeContent({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const { users, loading, error, refreshUsers } = useUsers('1'); // Host role = '1', so fetch users
  const [refreshing, setRefreshing] = useState(false);
  const { initiateCall } = useVideoCallContext();

  useEffect(() => {
    // Get current user data
    const getCurrentUser = async () => {
      const userData = await AuthStorage.getUser();
      setCurrentUser(userData);
    };
    getCurrentUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUsers();
    setRefreshing(false);
  };

  const handleUserPress = (user) => {
    // Handle user press - navigate to user profile or start chat
    Alert.alert('User Selected', `You tapped on ${user.name || user.username}`);
  };

  const handleVideoCall = (user) => {
    try {
      initiateCall(user.id, 'video');
    } catch (e) {
      console.warn('Failed to initiate video call', e);
      Alert.alert('Call Error', 'Unable to start the call. Please try again.');
    }
  };

  const handleAudioCall = (user) => {
    try {
      initiateCall(user.id, 'audio');
    } catch (e) {
      console.warn('Failed to initiate audio call', e);
      Alert.alert('Call Error', 'Unable to start the call. Please try again.');
    }
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-gray-500 text-lg text-center">
        No users found
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2">
        Pull down to refresh
      </Text>
    </View>
  );

  const renderError = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-red-500 text-lg text-center">
        Error loading users
      </Text>
      <Text className="text-gray-500 text-sm text-center mt-2">
        {error}
      </Text>
    </View>
  );

    const renderUserItem = ({ item }) => (
    <UserCard 
      user={item} 
      onPress={handleUserPress}
      onVideoCall={handleVideoCall}
      onAudioCall={handleAudioCall}
    />
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-2">Loading users...</Text>
      </View>
    );
  }

  // Filter only online users (backend may send either status or is_online boolean)
  const onlineUsers = users.filter(u => {
    const status = u.status || (u.is_online ? 'online' : 'offline');
    return status === 'online';
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Top Bar */}
  <HostTopBar onProfilePress={() => navigation.navigate('HostNotification')} />

      {/* Header */}

      {/* User List */}
      <View style={{ flex: 1 }}>
        {error ? (
          renderError()
        ) : (
          <FlatList
            data={onlineUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingVertical: 16,
              flexGrow: 1,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6366f1']}
                tintColor="#6366f1"
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>

      {/* Bottom Bar */}
      <HostBottomBar navigation={navigation} activeTab="Home" />
    </View>
  );
}

export default function HostHome({ navigation }) {
  return (
    <AuthenticatedScreenWrapper>
      <HostHomeContent navigation={navigation} />
    </AuthenticatedScreenWrapper>
  );
}
