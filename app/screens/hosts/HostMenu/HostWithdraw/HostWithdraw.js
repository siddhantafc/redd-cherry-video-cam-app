import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Wallet, Money, Clock } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../../utils/authStorage';

const HostWithdraw = ({ navigation }) => {
  const [pointsBalance, setPointsBalance] = useState(0);
  const [withdrawPoints, setWithdrawPoints] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hostProfile, setHostProfile] = useState(null);

  // Conversion rates
  const POINTS_TO_RUPEES = 6; // 1 point = 6 rupees

  useEffect(() => {
    fetchHostProfile();
  }, []);

  const fetchHostProfile = async () => {
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
        setHostProfile(data.profile);
        setPointsBalance(data.profile.host_points_balance || 0);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching host profile:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    // Validation
    const points = parseInt(withdrawPoints);
    
    if (!points || points <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid number of points greater than 0');
      return;
    }

    if (points > pointsBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough points for this withdrawal');
      return;
    }

    // Confirmation
    const amount = points * POINTS_TO_RUPEES;
    Alert.alert(
      'Confirm Withdrawal',
      `Are you sure you want to withdraw ${points} points (₹${amount})?\n\nThis request will be processed within 24-48 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitWithdrawal }
      ]
    );
  };

  const submitWithdrawal = async () => {
    try {
      setSubmitting(true);
      const token = await AuthStorage.getToken();
      const points = parseInt(withdrawPoints);

      const response = await fetch(`${API_BASE_URL}/api/host/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ points }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Withdrawal Requested', 
          'Your withdrawal request has been submitted successfully. You will receive the amount within 24-48 hours.',
          [{ text: 'OK', onPress: () => {
            setWithdrawPoints('');
            fetchHostProfile(); // Refresh balance
          }}]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateAmount = () => {
    const points = parseInt(withdrawPoints) || 0;
    return points * POINTS_TO_RUPEES;
  };

  const renderBalance = () => (
    <View className="bg-white rounded-xl p-6 mx-4 mb-6 shadow-sm border border-gray-200">
      <View className="flex-row items-center mb-2">
        <Wallet size={24} color="#374151" weight="bold" />
        <Text className="text-gray-900 text-lg font-semibold ml-2">Available Balance</Text>
      </View>
      <Text className="text-gray-900 text-3xl font-bold">{pointsBalance} Points</Text>
      <Text className="text-gray-600 text-sm mt-1">
        ≈ ₹{(pointsBalance * POINTS_TO_RUPEES).toLocaleString()}
      </Text>
    </View>
  );

  const renderWithdrawalForm = () => (
    <View className="bg-white rounded-xl mx-4 p-6 shadow-sm">
      <View className="flex-row items-center mb-4">
        <Money size={24} color="#374151" weight="bold" />
        <Text className="text-gray-900 text-lg font-semibold ml-2">Withdrawal Request</Text>
      </View>

      {/* Points Input */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Points to Withdraw</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
          placeholder="Enter points to withdraw"
          placeholderTextColor="#9ca3af"
          value={withdrawPoints}
          onChangeText={setWithdrawPoints}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      {/* Amount Preview */}
      {withdrawPoints && parseInt(withdrawPoints) > 0 && (
        <View className="bg-gray-50 rounded-lg p-4 mb-4">
          <Text className="text-gray-600 text-sm">You will receive</Text>
          <Text className="text-gray-900 text-xl font-bold">₹{calculateAmount().toLocaleString()}</Text>
          <Text className="text-gray-500 text-xs mt-1">
            Processing time: 24-48 hours
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        className={`py-4 rounded-lg ${
          submitting || !withdrawPoints || parseInt(withdrawPoints) <= 0
            ? 'bg-gray-300' 
            : 'bg-gray-900'
        }`}
        onPress={handleWithdrawal}
        disabled={submitting || !withdrawPoints || parseInt(withdrawPoints) <= 0}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Request Withdrawal
          </Text>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View className="mt-4 p-4 bg-gray-50 rounded-lg">
        <Text className="text-gray-900 text-sm font-medium mb-1">Important Notes:</Text>
        <Text className="text-gray-700 text-xs">
          • 1 Point = ₹6 {'\n'}
          • You can withdraw any amount of points (minimum 1 point){'\n'}
          • Processing time: 24-48 hours{'\n'}
          • Amount will be credited to your registered bank account{'\n'}
          • Make sure your bank details are updated
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-900">Withdraw</Text>
        </View>
        
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#374151" />
          <Text className="text-gray-600 mt-2">Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-900">Withdraw</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View className="pt-6">
          {renderBalance()}
        </View>

        {/* Withdrawal Form */}
        {renderWithdrawalForm()}

      </ScrollView>
    </View>
  );
};

export default HostWithdraw;
