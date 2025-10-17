import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { UserCircle } from 'phosphor-react-native';
import { AuthStorage } from '../../../utils/authStorage';

export default function UserMenuProfileInformation() {
	const [user, setUser] = useState(null);

	useEffect(() => {
		(async () => {
			const u = await AuthStorage.getUser();
			setUser(u || {});
		})();
	}, []);

	const item = (label, value) => (
		<View className="flex-row justify-between items-center py-3 border-b border-gray-100">
			<Text className="text-gray-500">{label}</Text>
			<Text className="text-gray-900 font-medium">{value || '—'}</Text>
		</View>
	);

	return (
		<View className="bg-white rounded-xl border border-gray-200 p-4">
			<View className="flex-row items-center mb-4">
				<UserCircle size={48} color="#6b7280" weight="regular" />
				<View className="ml-3">
					<Text className="text-base font-semibold text-gray-900">
						{user?.username || 'User'}
					</Text>
				</View>
			</View>

			{item('Username', user?.username)}
			{item('Email', user?.email)}
			{item('Phone', user?.phone)}
		</View>
	);
}
