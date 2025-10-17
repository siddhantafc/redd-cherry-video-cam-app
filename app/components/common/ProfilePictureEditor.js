import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { UserCircle, PencilSimple } from 'phosphor-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@env';
import AuthStorage from '../../utils/authStorage';

const ProfilePictureEditor = ({ profileUrl, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(profileUrl);

  useEffect(() => {
    setImageUrl(profileUrl);
  }, [profileUrl]);

  const handleEdit = () => {
    console.log('[ProfilePictureEditor] Opening action sheet alert');
    Alert.alert('Profile Picture', 'Choose an action', [
      { text: 'Upload', onPress: () => pickImage() },
      { text: 'Delete', onPress: () => deleteImage(), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickImage = async () => {
    try {
      // iOS requires separate permission for camera roll; Android usually grants automatically after manifest
  console.log('[ProfilePictureEditor] Requesting media library permission');
  const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  console.log('[ProfilePictureEditor] Permission status:', permResult.status);
      if (permResult.status !== 'granted') {
        Alert.alert('Permission required', 'Media library permission is needed to select a photo.');
        return;
      }

      console.log('[ProfilePictureEditor] Launching image picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.IMAGE : (ImagePicker.MediaTypeOptions?.Images || 'Images'),
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        selectionLimit: 1,
      });
      console.log('[ProfilePictureEditor] Picker result received', result ? { canceled: result.canceled, assets: result.assets?.length } : 'null');

      if (!result) {
        Alert.alert('Picker error', 'No response from image picker.');
        return;
      }

      if (result.canceled) return; // user closed picker

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert('No image', 'Could not retrieve the selected image.');
        return;
      }
      uploadImage(asset);
    } catch (e) {
      console.log('pickImage error', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error while opening picker');
    }
  };

  const uploadImage = async (asset) => {
    setLoading(true);
    try {
  const token = await AuthStorage.getToken();
  console.log('[ProfilePictureEditor] Upload token present?', !!token);
      if (!token) {
        Alert.alert('Auth error', 'You are not authenticated.');
        return;
      }

      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `profile_${Date.now()}.jpg`;
      // Prefer explicit mimeType field if present (newer Expo versions)
      let mimeType = (asset.mimeType || asset.type || '').toLowerCase();
      const extFromName = (fileName.split('.').pop() || '').toLowerCase();
      const extFromUri = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
      const ext = extFromName || extFromUri;
      const mapByExt = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        heic: 'image/heic',
        heif: 'image/heif'
      };
      if (!mimeType || mimeType === 'image') {
        if (ext && mapByExt[ext]) mimeType = mapByExt[ext];
      }
      if (!mimeType.startsWith('image/')) mimeType = 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: fileName,
        type: mimeType,
      });

      console.log('[ProfilePictureEditor] Uploading image to server', { uri, fileName, mimeType });
      const res = await fetch(`${API_BASE_URL}/api/profile-picture/profile/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type manually; let fetch set the multipart boundary
        },
        body: formData,
      });
      console.log('[ProfilePictureEditor] Server responded status', res.status);

      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* keep raw text */ }
      console.log('[ProfilePictureEditor] Raw upload response:', text);
      if (!res.ok) {
        const serverMsg = data?.error || data?.message || text || `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }
      if (data?.success && data?.url) {
        console.log('[ProfilePictureEditor] Upload success URL:', data.url);
        setImageUrl(data.url);
        onChange && onChange(data.url);
      } else {
        throw new Error(data?.error || data?.message || 'Upload failed');
      }
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async () => {
    setLoading(true);
    try {
  const token = await AuthStorage.getToken();
  console.log('[ProfilePictureEditor] Delete token present?', !!token);
      if (!token) {
        Alert.alert('Auth error', 'You are not authenticated.');
        return;
      }
      console.log('[ProfilePictureEditor] Sending delete request');
      const res = await fetch(`${API_BASE_URL}/api/profile-picture/profile/image`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[ProfilePictureEditor] Delete response status', res.status);
      let data;
      try { data = await res.json(); } catch { data = null; }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (data?.success) {
        console.log('[ProfilePictureEditor] Delete success');
        setImageUrl(null);
        onChange && onChange(null);
      } else {
        throw new Error(data?.error || 'Delete failed');
      }
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4B5563" />
      ) : imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.iconBg}>
          <UserCircle size={80} color="#9CA3AF" weight="duotone" />
        </View>
      )}
      <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
        <PencilSimple size={22} color="#fff" weight="bold" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4B5563',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default ProfilePictureEditor;
