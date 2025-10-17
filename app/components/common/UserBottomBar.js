import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { House, List } from 'phosphor-react-native';

const ICON_SIZE = 28;

const UserBottomBar = ({ navigation, activeTab }) => {
		const goTo = (routeName, fallback) => {
			try {
				navigation.navigate(routeName);
			} catch (e) {
				if (fallback) navigation.navigate(fallback);
			}
		};

	return (
		<View className="flex-row justify-around items-center bg-primary border-t border-gray-200 py-2">
			<TouchableOpacity
				className="flex-1 items-center"
				onPress={() => goTo('UserHome')}
			>
				<House
					size={ICON_SIZE}
					color={activeTab === 'Home' ? '#ffffff' : '#cbd5e1'}
					weight={activeTab === 'Home' ? 'fill' : 'regular'}
				/>
				<Text className={`text-xs mt-1 ${activeTab === 'Home' ? 'text-white font-bold' : 'text-gray-300'}`}>Home</Text>
			</TouchableOpacity>

			<TouchableOpacity
				className="flex-1 items-center"
			onPress={() => goTo('UserMenu', 'UserHome')}
			>
				<List
					size={ICON_SIZE}
					color={activeTab === 'Menu' ? '#ffffff' : '#cbd5e1'}
					weight={activeTab === 'Menu' ? 'fill' : 'regular'}
				/>
				<Text className={`text-xs mt-1 ${activeTab === 'Menu' ? 'text-white font-bold' : 'text-gray-300'}`}>Menu</Text>
			</TouchableOpacity>
		</View>
	);
};

export default UserBottomBar;

