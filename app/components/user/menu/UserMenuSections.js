import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import UserMenuProfileInformation from './UserMenuProfileInformation';
import UserMenuRechargeSection from './UserMenuRechargeSection';
import UserMenuSettings from './UserMenuSettings';

export default function UserMenuSections({ navigation }) {
	return (
		<ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
			{/* Profile information */}
			<View className="px-4 pt-4">
				<UserMenuProfileInformation />
			</View>

			{/* Recharge section */}
			<UserMenuRechargeSection navigation={navigation} />

			{/* Settings section */}
			<UserMenuSettings navigation={navigation} />
		</ScrollView>
	);
}

//Add UserProfileMenuInformation