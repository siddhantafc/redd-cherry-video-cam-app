import AuthenticatedScreenWrapper from '../../components/AuthenticatedScreenWrapper';
import UserHomeContent from './UserHomeContent/UserHomeContent';
import UserTopBar from '../../components/common/UserTopBar';
import UserBottomBar from '../../components/common/UserBottomBar';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function UserHome() {
  const navigation = useNavigation();
  return (
    <AuthenticatedScreenWrapper>
      <View className="flex-1 bg-gray-50">
        <UserTopBar />
        <UserHomeContent />
        <UserBottomBar navigation={navigation} activeTab="Home" />
      </View>
    </AuthenticatedScreenWrapper>
  );
}
