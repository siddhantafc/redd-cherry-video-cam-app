import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, Clock, CheckCircle, XCircle, CurrencyCircleDollar } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../../utils/authStorage';

const HostWithdrawalHistory = ({ navigation }) => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setError(null);
      const token = await AuthStorage.getToken();
      
      const response = await fetch(`${API_BASE_URL}/api/host/withdrawals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setWithdrawals(data.withdrawals || []);
      } else {
        setError(data.error || 'Failed to fetch withdrawal history');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawals();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600';
      case 'APPROVED': return 'text-blue-600';
      case 'PAID': return 'text-green-600';
      case 'REJECTED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} color="#d97706" />;
      case 'APPROVED': return <CheckCircle size={16} color="#2563eb" />;
      case 'PAID': return <CurrencyCircleDollar size={16} color="#16a34a" />;
      case 'REJECTED': return <XCircle size={16} color="#dc2626" />;
      default: return <Clock size={16} color="#6b7280" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderWithdrawal = ({ item }) => (
    <View className="bg-white mx-4 mb-3 rounded-lg shadow-sm border border-gray-100">
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base">
              {item.points} Points
            </Text>
            <Text className="text-gray-600 text-sm">
              ₹{item.amount.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center">
            {getStatusIcon(item.status)}
            <Text className={`ml-1 text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
              {item.status.toLowerCase()}
            </Text>
          </View>
        </View>
        
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-500 text-xs">
            Requested: {formatDate(item.createdAt)}
          </Text>
          {item.processedAt && (
            <Text className="text-gray-500 text-xs">
              Processed: {formatDate(item.processedAt)}
            </Text>
          )}
        </View>
        
        {item.remarks && (
          <View className="mt-2 p-2 bg-gray-50 rounded">
            <Text className="text-gray-700 text-xs">{item.remarks}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <CurrencyCircleDollar size={64} color="#d1d5db" />
      <Text className="text-gray-500 text-lg text-center mt-4">
        No withdrawals yet
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2">
        Your withdrawal history will appear here
      </Text>
    </View>
  );

  const renderError = () => (
    <View className="flex-1 items-center justify-center py-20">
      <XCircle size={64} color="#ef4444" />
      <Text className="text-red-500 text-lg text-center mt-4">
        Error loading history
      </Text>
      <Text className="text-gray-500 text-sm text-center mt-2">
        {error}
      </Text>
      <TouchableOpacity 
        className="bg-purple-600 px-6 py-2 rounded-lg mt-4"
        onPress={fetchWithdrawals}
      >
        <Text className="text-white font-medium">Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-gray-900">Withdrawal History</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-gray-600 mt-2">Loading...</Text>
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={withdrawals}
          renderItem={renderWithdrawal}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6366f1']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
};

export default HostWithdrawalHistory;
