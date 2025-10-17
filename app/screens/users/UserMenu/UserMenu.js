import React from 'react';
import { View } from 'react-native';
import AuthenticatedScreenWrapper from '../../../components/AuthenticatedScreenWrapper';
import UserTopBar from '../../../components/common/UserTopBar';
import UserBottomBar from '../../../components/common/UserBottomBar';
import UserMenuSections from '../../../components/user/menu/UserMenuSections';
import CopyrightFooter from '../../../components/common/CopyrightFooter';
import { useNavigation } from '@react-navigation/native';

export default function UserMenu() {
	const navigation = useNavigation();

	return (
		<AuthenticatedScreenWrapper>
			<View className="flex-1 bg-gray-50">
				{/* Top bar */}
				<UserTopBar />

			{/* Sections */}
			<UserMenuSections navigation={navigation} />

			{/* Copyright Footer */}
			<CopyrightFooter />

				{/* Bottom bar */}
				<UserBottomBar navigation={navigation} activeTab="Menu" />
			</View>
		</AuthenticatedScreenWrapper>
	);
}

//Add Top bar
//Add UserMenuSections
//Add bottom bar