
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ImageSquareIcon, VideoCameraIcon, IdentificationBadgeIcon, FilmSlateIcon } from 'phosphor-react-native';
import { API_BASE_URL } from '@env';
import { getToken } from '../../../utils/authStorage';


const HostMyProfileSection = ({ navigation }) => {
  const [profileUrl, setProfileUrl] = useState(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/api/profile-picture/profile/image`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setProfileUrl(data.url);
      } catch (e) {
        // ignore
      }
    };
    fetchProfileImage();
  }, []);

  return (
    <View className="px-6 pt-4 pb-2">
      <View className="bg-white rounded-lg shadow">
        <Text className="text-sm font-semibold text-gray-800 px-4 py-2">My Profile</Text>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostImages')}
        >
          <ImageSquareIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">My Images</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostVideos')}
        >
          <VideoCameraIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">My Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostKycImages')}
        >
          <IdentificationBadgeIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">My KYC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-2"
          onPress={() => navigation.navigate('HostAuditionVideo')}
        >
          <FilmSlateIcon size={24} color="#4B5563" weight="duotone" />
          <Text className="ml-3 text-base text-gray-700">My Audition Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HostMyProfileSection;
