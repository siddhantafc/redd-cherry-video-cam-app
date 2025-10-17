
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AuthStorage from '../../../utils/authStorage';
import { API_BASE_URL } from '@env';
import ProfilePictureEditor from '../../common/ProfilePictureEditor';

const MenuProfileInformation = () => {
  const [host, setHost] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHostProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await AuthStorage.getToken();
          const res = await fetch(`${API_BASE_URL}/api/profile/host`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (res.ok && data.profile) {
          setHost(data.profile);
          setProfileUrl(data.profile.profilePictureUrl || null);
        } else {
          setError(data.error || 'Failed to fetch host profile');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchHostProfile();
  }, []);

  if (loading) {
    return (
      <View className="flex-row items-center p-4 bg-white rounded-lg shadow mb-4 mx-4 mt-4 justify-center">
        <ActivityIndicator size="small" color="#6366f1" />
        <Text className="ml-2 text-gray-500">Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-row items-center p-4 bg-white rounded-lg shadow mb-4 mx-4 mt-4 justify-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-lg shadow mb-4 mx-4 mt-4">
      {/* Profile Section */}
      <View className="flex-row items-center p-4">
        <View style={{ marginRight: 16 }}>
          <ProfilePictureEditor
            profileUrl={profileUrl}
            onChange={(url) => {
              setProfileUrl(url);
              setHost((prev) => prev ? { ...prev, profilePictureUrl: url } : prev);
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text className="text-lg font-semibold text-gray-900">{host.name || 'Host'}</Text>
          <Text className="text-sm text-gray-500">@{host.username}</Text>
        </View>
      </View>
      
      {/* Points Balance Section */}
      <View className="px-4 pb-4">
        <View className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-yellow-800 text-sm font-medium">Earnings Balance</Text>
              <Text className="text-yellow-900 text-xl font-bold">{host.host_points_balance || 0} Points</Text>
              <Text className="text-yellow-700 text-xs">≈ ₹{((host.host_points_balance || 0) * 6).toLocaleString()}</Text>
            </View>
            <View className="bg-yellow-100 rounded-full p-2">
              <Text className="text-yellow-600 text-lg">⭐</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MenuProfileInformation;
