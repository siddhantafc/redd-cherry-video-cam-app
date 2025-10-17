import { View, Text, TouchableOpacity } from 'react-native';
export default function SignupTab({ tab, setTab }) {
  return (
    <View className="flex-row justify-center mb-6">
      <View className="flex-row bg-primary rounded-full p-1">
        <TouchableOpacity
          className={`px-6 py-2 rounded-full ${tab === 'user' ? 'bg-white' : 'bg-primary'}`}
          style={{ minWidth: 90, alignItems: 'center' }}
          onPress={() => setTab('user')}
        >
          <Text className={`text-base font-semibold ${tab === 'user' ? 'text-primary' : 'text-white'}`}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-6 py-2 rounded-full ml-2 ${tab === 'host' ? 'bg-white' : 'bg-primary'}`}
          style={{ minWidth: 90, alignItems: 'center' }}
          onPress={() => setTab('host')}
        >
          <Text className={`text-base font-semibold ${tab === 'host' ? 'text-primary' : 'text-white'}`}>Host 👧</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
