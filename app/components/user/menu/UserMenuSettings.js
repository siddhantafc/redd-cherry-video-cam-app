import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FileText, SignOut, WarningCircle } from 'phosphor-react-native';
import AuthStorage from '../../../utils/authStorage';
import { useAuth } from '../../../contexts/AuthContext';

const UserMenuSettings = ({ navigation }) => {
  const { logout } = useAuth();
	const handleLogout = () => {
		Alert.alert(
			'Logout',
			'Are you sure you want to logout?',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Logout',
					style: 'destructive',
					onPress: async () => {
            try { await AuthStorage.clearAuthData(); } catch (e) {}
            try { await logout(); } catch (e) {}
            // RootNavigator handles navigation switch
					},
				},
			]
		);
	};

	return (
		<View className="px-6 pt-4 pb-2">
			<View className="bg-white rounded-lg shadow">
				<Text className="text-sm font-semibold text-gray-800 px-4 py-2">Settings</Text>

				<TouchableOpacity
					className="flex-row items-center px-4 py-3 border-t border-gray-100"
					onPress={() => navigation.navigate('TermsAndConditions')}
				>
					<FileText size={24} color="#4B5563" weight="duotone" />
					<Text className="ml-3 text-base text-gray-700">Terms and Conditions</Text>
				</TouchableOpacity>
			</View>

			<View className="bg-white rounded-lg shadow mt-4">
						<TouchableOpacity
							className="flex-row items-center px-4 py-3 border-b border-gray-100"
							onPress={() => navigation.navigate('ReportIssue')}
						>
							<WarningCircle size={24} color="#9333ea" weight="duotone" />
							<Text className="ml-3 text-base text-gray-700">Report a problem</Text>
						</TouchableOpacity>
				<TouchableOpacity
					className="flex-row items-center px-4 py-3"
					onPress={handleLogout}
				>
					<SignOut size={24} color="#dc2626" weight="duotone" />
					<Text className="ml-3 text-base font-semibold text-red-700">Log Out</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default UserMenuSettings;
