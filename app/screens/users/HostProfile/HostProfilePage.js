import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { X, PlayCircle, CheckCircle, Crown } from 'phosphor-react-native';
import { getVideoThumbnail } from '../../../lib/videoThumbnailCache';
import { useNavigation } from '@react-navigation/native';
import { useFeedMedia } from '../../../hooks/useFeedMedia';

const maskPhone = (value) => {
  if (!value) return '';
  let masked = '';
  let digitsSeen = 0;
  for (let i = value.length - 1; i >= 0; i--) {
    const ch = value[i];
    if (/[0-9]/.test(ch)) {
      if (digitsSeen < 4) {
        masked = '*' + masked;
      } else {
        masked = ch + masked;
      }
      digitsSeen++;
    } else {
      masked = ch + masked;
    }
  }
  return masked;
};

export default function HostProfilePage({ route }) {
  const host = route?.params?.host || {};
  const status = host?.status || (host?.is_online ? 'online' : 'offline');
  const phoneMasked = useMemo(() => maskPhone(host?.phone || host?.phoneNumber), [host?.phone, host?.phoneNumber]);
  const genderDisplay = useMemo(() => {
    const g = host?.gender;
    if (!g) return null;
    return String(g).charAt(0).toUpperCase() + String(g).slice(1);
  }, [host?.gender]);
  const isVerified = !!(host?.is_verified ?? host?.verified);
  const isPremium = !!(host?.is_premium ?? host?.premium);
  const navigation = useNavigation();
  const [tab, setTab] = useState('all'); // all | photos | videos
  const { images, videos, loading, error } = useFeedMedia(host?.id);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const listRef = useRef(null);
  const [thumbs, setThumbs] = useState({});

  useEffect(() => {
    if (previewVisible && listRef.current && typeof previewIndex === 'number') {
      try {
        listRef.current.scrollToIndex({ index: previewIndex, animated: false });
      } catch (e) {
        // no-op if index out of range briefly during data changes
      }
    }
  }, [previewVisible, previewIndex]);

  const mediaItems = useMemo(() => {
    const imgItems = (images || []).map(i => ({ type: 'image', id: i.id, url: i.url }));
    const vidItems = (videos || []).map(v => ({ type: 'video', id: v.id, url: v.url }));
    if (tab === 'photos') return imgItems;
    if (tab === 'videos') return vidItems;
    return [...imgItems, ...vidItems];
  }, [images, videos, tab]);
  const viewerList = mediaItems; // unified list for modal (images + videos per tab)

  useEffect(() => {
    let cancelled = false;
    async function prepareThumbs() {
      const entries = await Promise.all((videos || []).map(async v => {
        try {
          const t = await getVideoThumbnail(v.url);
          return [v.id, t];
        } catch {
          return [v.id, null];
        }
      }));
      if (!cancelled) {
        const map = {};
        for (const [k, v] of entries) map[k] = v;
        setThumbs(map);
      }
    }
    if (videos && videos.length) prepareThumbs();
    return () => { cancelled = true; };
  }, [videos]);

  const TabButton = ({ value, label }) => (
    <TouchableOpacity
      onPress={() => setTab(value)}
      className={`px-4 py-2 rounded-full mr-2 border ${
        tab === value ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200'
      }`}
    >
      <Text className={`${tab === value ? 'text-indigo-700' : 'text-gray-700'} text-sm font-medium`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header with back */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="px-2 py-1 mr-2">
          <Text className="text-indigo-600 font-semibold">Back</Text>
        </TouchableOpacity>
        <Text className="text-gray-900 font-bold text-base" numberOfLines={1}>Profile</Text>
      </View>
      <View className="flex-row items-center pt-8 pb-4 px-6">
        {host?.profilePictureUrl ? (
          <Image source={{ uri: host.profilePictureUrl }} className="w-32 h-32 rounded-3xl mr-4" />
        ) : (
          <View className="w-28 h-28 rounded-3xl bg-gray-200 items-center justify-center mr-4">
            <Text className="text-gray-700 font-semibold text-2xl">
              {(host?.name || host?.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-sm capitalize" numberOfLines={1}>
            {host?.name.toLowerCase()}
          </Text>
          <View className="mt-1">
              <Text className="text-gray-600 text-sm">{host?.username}</Text>
            </View>
          <View className="flex-row items-center mt-1 flex-wrap">
            {phoneMasked ? (
              <Text className="text-gray-600 text-sm mr-2">{phoneMasked}</Text>
            ) : null}
            <View className="px-3 py-1 rounded-full bg-gray-200 mt-1">
              <Text className={`text-xs font-medium ${
                status === 'online' ? 'text-emerald-700' : status === 'busy' ? 'text-amber-700' : 'text-gray-600'
              }`}>
                {status === 'online' ? 'Online' : status === 'busy' ? 'Busy' : 'Offline'}
              </Text>
            </View>
          </View>
          {genderDisplay ? (
            <View className="mt-1">
              <Text className="text-gray-600 text-sm">{genderDisplay}</Text>
            </View>
          ) : null}
          
        </View>
        
      </View>

      {(isVerified || isPremium) ? (
            <View className="flex-row items-center mb-2 mx-4">
              {isVerified ? (
                <View className="flex-row items-center rounded-full px-3 py-1 mr-2 border bg-sky-50 border-sky-200">
                  <CheckCircle size={14} color="#0369a1" weight="fill" />
                  <Text className="text-xs ml-1 text-sky-700">Verified</Text>
                </View>
              ) : null}
              {isPremium ? (
                <View className="flex-row items-center rounded-full px-3 py-1 border bg-amber-50 border-amber-200">
                  <Crown size={14} color="#b45309" weight="fill" />
                  <Text className="text-xs ml-1 text-amber-700">Premium</Text>
                </View>
              ) : null}
            </View>
          ) : null}

      {/* Media Tabs */}
      <View className="px-4 pt-2">
        <View className="flex-row mb-3">
          <TabButton value="all" label="All" />
          <TabButton value="photos" label="Photos" />
          <TabButton value="videos" label="Videos" />
        </View>
        {error ? (
          <Text className="text-red-500 text-sm">{String(error)}</Text>
        ) : null}
      </View>

      

      {/* Media Grid */}
      <View className="flex-row flex-wrap px-1 pb-4">
        {mediaItems.map(item => (
          <View key={`${item.type}-${item.id}`} className="w-1/3 p-1">
            {item.type === 'image' ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const idx = viewerList.findIndex(x => x.type === 'image' && x.id === item.id);
                  setPreviewIndex(idx >= 0 ? idx : 0);
                  setActiveIndex(idx >= 0 ? idx : 0);
                  setPreviewVisible(true);
                }}
              >
                <Image source={{ uri: item.url }} className="w-full rounded-lg bg-gray-200" style={{ aspectRatio: 3/4 }} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  const idx = viewerList.findIndex(x => x.type === 'video' && x.id === item.id);
                  setPreviewIndex(idx >= 0 ? idx : 0);
                  setActiveIndex(idx >= 0 ? idx : 0);
                  setPreviewVisible(true);
                }}
              >
                <View className="w-full rounded-lg overflow-hidden" style={{ aspectRatio: 3/4 }}>
                  {thumbs[item.id] ? (
                    <Image source={{ uri: thumbs[item.id] }} className="w-full h-full" />
                  ) : (
                    <View className="w-full h-full bg-gray-900 items-center justify-center">
                      <Text className="text-white text-xs">Loading…</Text>
                    </View>
                  )}
                  <View className="absolute inset-0 items-center justify-center">
                    <PlayCircle size={36} color="#ffffff" weight="fill" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {loading && (
          <Text className="px-4 py-4 text-gray-500">Loading media…</Text>
        )}
        {!loading && mediaItems.length === 0 && (
          <Text className="px-4 py-4 text-gray-500">No media yet</Text>
        )}
      </View>

      {/* Media Preview Modal (images + videos with swipe) */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View className="flex-1 bg-black/90">
          <View className="flex-row justify-end p-4">
            <TouchableOpacity onPress={() => setPreviewVisible(false)} className="p-2">
              <X size={28} color="#ffffff" weight="bold" />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={listRef}
            data={viewerList}
            horizontal
            pagingEnabled
            initialScrollIndex={previewIndex}
            getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
            keyExtractor={(it) => `${it.type}-${String(it.id)}`}
            renderItem={({ item, index }) => (
              <View style={{ width: screenWidth, height: '100%' }} className="items-center justify-center px-4 pb-8">
                {item.type === 'image' ? (
                  <Image source={{ uri: item.url }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Video
                    source={{ uri: item.url }}
                    resizeMode="contain"
                    style={{ width: '100%', height: '100%' }}
                    shouldPlay={activeIndex === index}
                    useNativeControls
                  />
                )}
              </View>
            )}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setPreviewIndex(idx);
              setActiveIndex(idx);
            }}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}
