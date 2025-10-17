
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SignOutIcon, WarningCircle } from 'phosphor-react-native';
import AuthStorage from '../../../utils/authStorage';
import { forceCloseSocket } from '../../../lib/socket';
import { useAuth } from '../../../contexts/AuthContext';


const HostSettingsSection = ({ navigation }) => {
  const { logout } = useAuth();


  return (
    <View className="px-6 pt-4 pb-2">
      <View className="bg-white rounded-lg shadow">
        {/* <Text className="text-sm font-semibold text-gray-800 px-4 py-2">Settings</Text> */}
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-100"
          onPress={() => navigation.navigate('HostReportIssue')}
        >
          <WarningCircle size={24} color="#9333ea" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">Report a problem</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2 bg-red-100 rounded-lg"
          onPress={() => {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: async () => {
                    try { forceCloseSocket(); } catch (e) {}
                    // Clear storage explicitly, then update context
                    await AuthStorage.clearAuthData();
                    try { await logout(); } catch (e) {}
                    // No manual navigation: RootNavigator will switch to Auth stack automatically
                  },
                },
              ],
              { cancelable: true }
            );
          }}
        >
          <SignOutIcon size={24} color="#dc2626" weight="duotone" />
          <Text className="ml-3 text-base font-semibold text-red-700">Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HostSettingsSection;
