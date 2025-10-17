import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../../utils/authStorage';


const IMAGE_SLOTS = 5;


const HostImages = ({ navigation }) => {
	// Store full image objects with id and url
  const [images, setImages] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  // Fetch images and check authentication on mount
  const [lastUploadTime, setLastUploadTime] = useState(0);	
	React.useEffect(() => {
		const fetchImagesAndAuth = async () => {
			const token = await AuthStorage.getToken();
			const user = await AuthStorage.getUser();
			console.log('Auth status:', { hasToken: !!token, user: user?.id });
			if (!token) {
				Alert.alert(
					'Authentication Required',
					'Please login to upload images.',
					[{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
				);
				setLoadingImages(false);
				return;
			}
			try {
				const apiBaseUrl = API_BASE_URL;
				const response = await fetch(`${apiBaseUrl}/api/feed/images`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
				});
				const data = await response.json();
				if (response.ok && data.images) {
					const imagesWithSlots = data.images.slice(0, IMAGE_SLOTS).map((img, index) => ({
						...img,
						slotIndex: index
					}));
					setImages(imagesWithSlots);
				} else {
					setImages([]);
				}
			} catch (err) {
				console.error('Error fetching feed images:', err);
				setImages([]);
			} finally {
				setLoadingImages(false);
			}
		};
		fetchImagesAndAuth();
	}, []);



	const uploadImageToBackend = async (uri) => {
		const startTime = Date.now();
		try {
			const token = await AuthStorage.getToken();
			if (!token) {
				throw new Error('Authentication required. Please login again.');
			}

			console.log('Starting file info check...');
			const fileInfo = await FileSystem.getInfoAsync(uri);
			if (!fileInfo.exists) {
				throw new Error('File does not exist');
			}

			const fileName = uri.split('/').pop() || `image_${Date.now()}.jpg`;
			const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
			
			console.log('File info:', { 
				fileName, 
				fileType, 
				exists: fileInfo.exists, 
				size: fileInfo.size,
				sizeKB: Math.round(fileInfo.size / 1024)
			});

			console.log('Creating FormData...');
			const formData = new FormData();
			formData.append('file', {
				uri,
				name: fileName,
				type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
			});

			const apiBaseUrl = API_BASE_URL;
			
			console.log('Starting upload request...');
			console.log('Uploading to:', `${apiBaseUrl}/api/feed/image`);

			// Add retry logic for network failures
			let response;
			let lastError;
			const maxRetries = 3;
			
			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					console.log(`Upload attempt ${attempt}/${maxRetries}`);
					
					// Add a small delay between retries
					if (attempt > 1) {
						await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
						console.log(`Retrying after ${1000 * attempt}ms delay...`);
					}
					
					response = await Promise.race([
						fetch(`${apiBaseUrl}/api/feed/image`, {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${token}`,
							},
							body: formData,
						}),
						new Promise((_, reject) => 
							setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
						)
					]);
					
					// If we get here, the request succeeded
					break;
				} catch (error) {
					lastError = error;
					console.log(`Upload attempt ${attempt} failed:`, error.message);
					
					// If it's the last attempt, don't retry
					if (attempt === maxRetries) {
						throw error;
					}
					
					// Retry on network errors
					if (error.message.includes('Network request failed') || 
					    error.message.includes('timeout') || 
					    error.name === 'TypeError') {
						continue;
					} else {
						throw error;
					}
				}
			}

			const uploadTime = Date.now() - startTime;
			console.log(`Upload request completed in ${uploadTime}ms`);
			console.log('Response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Upload failed with status:', response.status, 'Response:', errorText);
				throw new Error(`Upload failed: ${response.status} - ${errorText}`);
			}

			console.log('Parsing response...');
			const data = await response.json();
			console.log('Upload successful:', { 
				totalTime: Date.now() - startTime,
				imageId: data.feedImage?.id 
			});
			
			return data;
		} catch (err) {
			const totalTime = Date.now() - startTime;
			console.error('Upload error after', totalTime, 'ms:', {
				message: err.message,
				name: err.name
			});
			
			if (err.message.includes('Network request failed') || err.name === 'TypeError') {
				throw new Error('Network error: Please check your internet connection and try again');
			}
			
			throw err;
		}
	};


	const getImageForSlot = React.useCallback((slotIndex) => {
		return images.find(img => img.slotIndex === slotIndex) || null;
	}, [images]);

	const uploadToSlot = async (slotIndex) => {
		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (!permissionResult.granted) {
				Alert.alert('Permission required', 'Permission to access media library is required!');
				return;
			}
			
			// Ignore this MediaType Option being depricated
			let mediaTypes;
			if (ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images) {
				mediaTypes = ImagePicker.MediaTypeOptions.Images;
			} else if (ImagePicker.MediaType && ImagePicker.MediaType.Images) {
				mediaTypes = ImagePicker.MediaType.Images;
			} else {
				// Fallback to string value
				mediaTypes = 'Images';
			}
			
			let result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: mediaTypes,
				quality: 0.8, // Image Quality
				allowsEditing: true,
				aspect: [3, 4],
			});
			
			console.log('ImagePicker result:', result);
			if (!result.canceled && result.assets && result.assets[0]?.uri) {
				const uri = result.assets[0].uri;
				setUploading(true);
				
				try {
					// Add a small delay if multiple uploads are happening quickly
					const now = Date.now();
					const timeSinceLastUpload = now - lastUploadTime;
					if (timeSinceLastUpload < 2000) { // Less than 2 seconds
						const delay = 2000 - timeSinceLastUpload;
						console.log(`Waiting ${delay}ms before upload to prevent network overload...`);
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					
					console.log(`Starting upload for slot ${slotIndex}`);
					const uploadResult = await uploadImageToBackend(uri);
					setLastUploadTime(Date.now());
					
					if (uploadResult && uploadResult.feedImage) {
						console.log('Upload successful, updating state');
						// Add slotIndex to the uploaded image and update state efficiently
						const imageWithSlot = { ...uploadResult.feedImage, slotIndex };
						
						setImages(prev => {
							// Remove any existing image in this slot and add the new one
							const filtered = prev.filter(img => img.slotIndex !== slotIndex);
							const newImages = [...filtered, imageWithSlot];
							console.log('Updated images state:', newImages.length);
							return newImages;
						});
					} else {
						console.error('Invalid upload result:', uploadResult);
						Alert.alert('Upload failed', 'Could not upload image.');
					}
				} catch (e) {
					console.error('Upload error:', e);
					
					// Provide more specific error messages
					let errorMessage = 'Unknown error';
					if (e.message.includes('Network request failed')) {
						errorMessage = 'Network connection failed. Please check your internet connection and try again.';
					} else if (e.message.includes('timeout')) {
						errorMessage = 'Upload timed out. The file might be too large or your connection is slow.';
					} else if (e.message.includes('Authentication')) {
						errorMessage = 'Authentication failed. Please log in again.';
					} else {
						errorMessage = e?.message || 'Upload failed';
					}
					
					Alert.alert('Upload Failed', errorMessage, [
						{ text: 'OK', style: 'default' },
						{ text: 'Retry', onPress: () => uploadToSlot(slotIndex), style: 'default' }
					]);
				} finally {
					setUploading(false);
				}
			}
		} catch (err) {
			console.error('Error opening image picker:', err);
			Alert.alert('Error', err?.message || 'Could not open image picker.');
			setUploading(false);
		}
	};

	// Helper function to remove image from specific slot
	const removeFromSlot = async (slotIndex) => {
		const imageToDelete = getImageForSlot(slotIndex);
		if (!imageToDelete) return;

		Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete', style: 'destructive', onPress: async () => {
					try {
						const token = await AuthStorage.getToken();
						if (!token) {
							Alert.alert('Error', 'Authentication required');
							return;
						}
						
						const apiBaseUrl = API_BASE_URL;
						const response = await fetch(`${apiBaseUrl}/api/feed/image/${imageToDelete.id}`, {
							method: 'DELETE',
							headers: {
								'Authorization': `Bearer ${token}`,
							},
						});
						
						if (response.ok) {
							setImages(prev => prev.filter(img => img.slotIndex !== slotIndex));
						} else {
							Alert.alert('Error', 'Failed to delete image');
						}
					} catch (err) {
						console.error('Delete error:', err);
						Alert.alert('Error', 'Failed to delete image');
					}
				}
			}
		]);
	};

	// Render individual slot
	const renderSlot = (slotIndex, style = {}) => {
		const image = getImageForSlot(slotIndex);
		return (
			<View key={slotIndex} className="relative bg-transparent" style={[{ aspectRatio: 3/4 }, style]}>
				{image ? (
					<View className="w-full h-full bg-white rounded-2xl shadow-md overflow-hidden">
						<Image 
							source={{ uri: image.url }} 
							className="w-full h-full"
							style={{ resizeMode: 'cover' }}
						/>
						<View className="absolute inset-0 bg-black/0 hover:bg-black/10" />
						<TouchableOpacity 
							className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 rounded-full justify-center items-center shadow-lg"
							onPress={() => removeFromSlot(slotIndex)}
						>
							<Ionicons name="trash" size={16} color="#fff" />
						</TouchableOpacity>
						<View className="absolute bottom-2 left-2 bg-black/60 rounded-lg px-2 py-1">
							<Text className="text-white text-xs font-medium">#{slotIndex + 1}</Text>
						</View>
					</View>
				) : (
					<TouchableOpacity 
						className="w-full h-full bg-white rounded-2xl justify-center items-center border-2 border-dashed border-blue-200 shadow-sm"
						onPress={() => uploadToSlot(slotIndex)} 
						disabled={uploading}
						style={{ 
							borderColor: uploading ? '#E5E7EB' : '#BFDBFE',
							backgroundColor: uploading ? '#F9FAFB' : '#FEFEFF'
						}}
					>
						<View className="items-center">
							{uploading ? (
								<>
									<ActivityIndicator size="large" color="#3B82F6" />
									<Text className="text-gray-500 text-xs mt-2 font-medium">Uploading...</Text>
								</>
							) : (
								<>
									<View className="w-12 h-12 bg-blue-100 rounded-full justify-center items-center mb-3">
										<Ionicons name="camera" size={24} color="#3B82F6" />
									</View>
									<Text className="text-gray-600 text-xs font-medium mb-1">Add Photo</Text>
									<Text className="text-gray-400 text-xs">Slot {slotIndex + 1}</Text>
								</>
							)}
						</View>
					</TouchableOpacity>
				)}
			</View>
		);
	};

	// Prepare grid: 2,2,1 layout with 5 fixed slots
	const renderGrid = () => {
		if (loadingImages) {
			return (
				<View className="flex-1 justify-center items-center">
					<View className="bg-white rounded-xl p-6 shadow-sm">
						<ActivityIndicator size="large" color="#3B82F6" />
						<Text className="text-gray-600 mt-3 text-center">Loading your images...</Text>
					</View>
				</View>
			);
		}

		// Show the normal grid even if no images exist
		// This allows users to click on any slot to upload

		return (
			<View className="px-6">
				{/* Grid Title */}
				<View className="mb-6">
					<Text className="text-sm text-gray-500">Tap on empty slots to add new images</Text>
				</View>

				{/* First row: slots 0 and 1 */}
				<View className="flex-row mb-4 gap-4">
					<View className="flex-1">
						{renderSlot(0)}
					</View>
					<View className="flex-1">
						{renderSlot(1)}
					</View>
				</View>

				{/* Second row: slots 2 and 3 */}
				<View className="flex-row mb-4 gap-4">
					<View className="flex-1">
						{renderSlot(2)}
					</View>
					<View className="flex-1">
						{renderSlot(3)}
					</View>
				</View>

				{/* Third row: slot 4 (centered) */}
				<View className="flex-row justify-center mb-6">
					<View className="w-[48%]">
						{renderSlot(4)}
					</View>
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
						<Text className="text-2xl font-bold text-gray-900">My Gallery</Text>
						<Text className="text-sm text-gray-500 mt-1">Manage your profile images</Text>
					</View>
				</View>
				<View className="flex-row items-center mt-4">
					<View className="flex-1 bg-blue-50 px-3 py-2 rounded-lg">
						<Text className="text-xs font-medium text-blue-700">
							{images.length}/{IMAGE_SLOTS} images uploaded
						</Text>
					</View>
				</View>
			</View>

			<ScrollView 
				className="flex-1" 
				contentContainerStyle={{ 
					flexGrow: 1,
					paddingBottom: 20
				}}
				showsVerticalScrollIndicator={false}
			>
				{renderGrid()}
			</ScrollView>
		</View>
	);
};


export default HostImages;
