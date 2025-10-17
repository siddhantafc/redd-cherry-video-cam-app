import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CreditCard, ClockCounterClockwise } from 'phosphor-react-native';

const UserMenuRechargeSection = ({ navigation }) => {
	return (
		<View className="px-6 pt-4 pb-2">
			<View className="bg-white rounded-lg shadow">
				<Text className="text-sm font-semibold text-gray-800 px-4 py-2">Recharge</Text>

				<TouchableOpacity
					className="flex-row items-center px-4 py-3 border-t border-gray-100"
					onPress={() => navigation.navigate('UserRecharge')}
				>
					<CreditCard size={24} color="#4B5563" weight="duotone" />
					<Text className="ml-3 text-base text-gray-700">Recharge</Text>
				</TouchableOpacity>

				<TouchableOpacity
					className="flex-row items-center px-4 py-3 border-t border-gray-100"
					onPress={() => navigation.navigate('UserRechargeHistory')}
				>
					<ClockCounterClockwise size={24} color="#4B5563" weight="duotone" />
					<Text className="ml-3 text-base text-gray-700">Recharge History</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default UserMenuRechargeSection;

//Create this section with two buttons: "Recharge" and "Recharge History"
//Connect UserRecharge and UserRechargeHistory components to these buttons respectively
//Add suitable phosphor icons to the buttons
//Make it menu section style
