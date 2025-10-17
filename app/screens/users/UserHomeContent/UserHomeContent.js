import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import UserFeed from '../../../components/user/home/UserFeed';
import { useUsers } from '../../../hooks/useUsers';
import { AuthStorage } from '../../../utils/authStorage';
import { useVideoCallContext } from '../../../hooks/useVideoCallContext';
import { useNavigation } from '@react-navigation/native';

export default function UserHomeContent() {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const { users: hosts, loading, error, refreshUsers } = useUsers('2'); // User role = '2', so fetch hosts
  const [refreshing, setRefreshing] = useState(false);
  const { initiateCall } = useVideoCallContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const handleHostPress = (host) => {
    navigation.navigate('HostProfile', { host });
  };

  const handleVideoCall = (host) => {
    initiateCall(host.id, 'video');
  };

  const handleAudioCall = (host) => {
    initiateCall(host.id, 'audio');
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-gray-500 text-lg text-center">
        No hosts available
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2">
        Pull down to refresh
      </Text>
    </View>
  );

  const renderError = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-red-500 text-lg text-center">
        Error loading hosts
      </Text>
      <Text className="text-gray-500 text-sm text-center mt-2">
        {error}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-600 mt-2">Loading hosts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Feed */}
      <UserFeed
        hosts={hosts}
        loading={loading}
        error={error}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onHostPress={handleHostPress}
        onVideoCall={handleVideoCall}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusChange={setStatusFilter}
      />
    </View>
  );
}
