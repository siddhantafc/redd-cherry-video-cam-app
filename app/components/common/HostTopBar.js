import React, { useState, useEffect } from 'react';
import { View, Image, Text } from 'react-native';
import { Star } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../utils/authStorage';

const HostTopBar = ({ onProfilePress }) => {
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHostBalance();
  }, []);

  const fetchHostBalance = async () => {
    try {
      setLoading(true);
      const token = await AuthStorage.getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/profile/host`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok && data.profile) {
        setPointsBalance(data.profile.host_points_balance || 0);
      }
    } catch (error) {
      console.error('Error fetching host balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPoints = (points) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  return (
    <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
      {/* Logo on the left */}
      <Image
        source={require('../../assets/images/logo_trans_512.png')}
        style={{ width: 40, height: 40 }}
        resizeMode="contain"
      />
      
      {/* Points Balance */}
      <View className="flex-row items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
        <Star size={20} color="#f59e0b" weight="fill" />
        <Text className="ml-1 text-gray-800 font-medium">{formatPoints(pointsBalance)} pts</Text>
      </View>
    </View>
  );
};

export default HostTopBar;
