import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../../utils/authStorage';

const KYC_TYPES = [
	{ key: 'aadhaar', label: 'Aadhaar Card' },
	{ key: 'voterid', label: 'Voter ID' },
];

const HostKycImages = ({ navigation }) => {
	const [images, setImages] = useState([]); // [{id,url,type,createdAt}]
	const [loading, setLoading] = useState(true);
	const [uploadingType, setUploadingType] = useState(null); // 'aadhaar' | 'voterid' | null

	const byType = useMemo(() => {
		const map = { aadhaar: null, voterid: null };
		for (const img of images) {
			if (!map[img.type]) map[img.type] = img; // keep the latest (API already returns desc)
		}
		return map;
	}, [images]);

	const fetchKycImages = useCallback(async () => {
		try {
			setLoading(true);
			const token = await AuthStorage.getToken();
			if (!token) {
				Alert.alert('Authentication Required', 'Please login to manage KYC documents.', [
					{ text: 'Go to Login', onPress: () => navigation.navigate('Login') },
				]);
				return;
			}
			const res = await fetch(`${API_BASE_URL}/api/kyc/images`, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setImages(Array.isArray(data.images) ? data.images : []);
			} else {
				setImages([]);
			}
		} catch (e) {
			setImages([]);
		} finally {
			setLoading(false);
		}
	}, [navigation]);

	useEffect(() => {
		fetchKycImages();
	}, [fetchKycImages]);

	const pickAndUpload = async (typeKey) => {
		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert('Permission required', 'Access to media library is required!');
				return;
			}

			let mediaTypes;
			if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
				mediaTypes = ImagePicker.MediaTypeOptions.Images;
			} else if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
				mediaTypes = ImagePicker.MediaType.Images;
			} else {
				mediaTypes = 'Images';
			}

					const result = await ImagePicker.launchImageLibraryAsync({
						mediaTypes,
						quality: 0.9,
						allowsEditing: false,
					});

			if (result.canceled || !result.assets?.[0]?.uri) return;

			setUploadingType(typeKey);
			const uri = result.assets[0].uri;

			const token = await AuthStorage.getToken();
			if (!token) throw new Error('Authentication required. Please login again.');

			const info = await FileSystem.getInfoAsync(uri);
			if (!info.exists) throw new Error('Selected file not found');

			const fileName = uri.split('/').pop() || `kyc_${typeKey}_${Date.now()}.jpg`;
			const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
			const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

			const formData = new FormData();
			formData.append('file', { uri, name: fileName, type: mime });
			formData.append('type', typeKey);

			const res = await fetch(`${API_BASE_URL}/api/kyc/image`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});
			const data = await res.json();
			if (!res.ok || !data.success) {
				throw new Error(data?.error || 'Upload failed');
			}

			// Update state with new image
			const newImg = data.kycImage;
			setImages((prev) => {
				const filtered = prev.filter((i) => i.type !== typeKey);
				return [newImg, ...filtered];
			});
			Alert.alert('Success', `${typeKey === 'aadhaar' ? 'Aadhaar' : 'Voter ID'} uploaded successfully.`);
		} catch (e) {
			Alert.alert('Upload Failed', e?.message || 'Could not upload KYC document');
		} finally {
			setUploadingType(null);
		}
	};

	const deleteImage = (img) => {
		Alert.alert('Delete Document', 'Are you sure you want to delete this document?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete', style: 'destructive', onPress: async () => {
					try {
						const token = await AuthStorage.getToken();
						if (!token) throw new Error('Authentication required');
						const res = await fetch(`${API_BASE_URL}/api/kyc/image/${img.id}`, {
							method: 'DELETE',
							headers: { Authorization: `Bearer ${token}` },
						});
						const data = await res.json().catch(() => ({}));
						if (!res.ok) throw new Error(data?.error || 'Delete failed');
						setImages((prev) => prev.filter((i) => i.id !== img.id));
					} catch (e) {
						Alert.alert('Error', e?.message || 'Failed to delete');
					}
				}
			}
		]);
	};

	const renderCard = (type) => {
		const img = byType[type.key];
		const uploading = uploadingType === type.key;
		return (
			<View key={type.key} className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
				<View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
					<Text className="text-base font-semibold text-gray-900">{type.label}</Text>
					{img ? (
						<TouchableOpacity
							className="px-3 py-1.5 bg-red-50 rounded-full"
							onPress={() => deleteImage(img)}
						>
							<Text className="text-red-600 text-xs font-medium">Delete</Text>
						</TouchableOpacity>
					) : null}
				</View>
				<View className="p-4">
					{img ? (
						<View className="relative rounded-xl overflow-hidden">
							<Image source={{ uri: img.url }} className="w-full h-56" style={{ resizeMode: 'cover' }} />
							<View className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1">
								<Text className="text-white text-xs">Uploaded</Text>
							</View>
						</View>
					) : (
						<TouchableOpacity
							disabled={uploading}
							onPress={() => pickAndUpload(type.key)}
							className="h-44 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/20 justify-center items-center"
						>
							{uploading ? (
								<>
									<ActivityIndicator size="large" color="#3B82F6" />
									<Text className="text-gray-500 text-xs mt-2">Uploading...</Text>
								</>
							) : (
								<>
									<View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mb-2">
										<Ionicons name="document-text" size={22} color="#3B82F6" />
									</View>
									<Text className="text-gray-700 text-sm font-medium">Upload {type.label}</Text>
									<Text className="text-gray-400 text-xs mt-1">PNG, JPG up to 10MB</Text>
								</>
							)}
						</TouchableOpacity>
					)}
								{/* Replace action removed as requested */}
				</View>
			</View>
		);
	};

	return (
		<View className="flex-1 bg-gray-50">
			{/* Header */}
			<View className="pt-14 pb-6 px-6 bg-white shadow-sm">
				<View className="flex-row items-center mb-2">
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						className="w-10 h-10 justify-center items-center bg-gray-100 rounded-full mr-4"
					>
						<Ionicons name="arrow-back" size={20} color="#374151" />
					</TouchableOpacity>
					<View className="flex-1">
						<Text className="text-2xl font-bold text-gray-900">My KYC</Text>
						<Text className="text-sm text-gray-500 mt-1">Upload Aadhaar and Voter ID</Text>
					</View>
				</View>
			</View>

			<ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
				{loading ? (
					<View className="flex-1 justify-center items-center mt-20">
						<ActivityIndicator size="large" color="#3B82F6" />
						<Text className="text-gray-600 mt-3">Loading KYC documents...</Text>
					</View>
				) : (
					KYC_TYPES.map(renderCard)
				)}
			</ScrollView>
		</View>
	);
};

export default HostKycImages;
