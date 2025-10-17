import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable, StatusBar, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { VideoCamera, Trash, X, Play } from 'phosphor-react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'phosphor-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthStorage } from '../../../../utils/authStorage';
import { API_BASE_URL } from '@env';

const MAX_SIZE_BYTES = 250 * 1024 * 1024; // 250MB
const apiBase = `${API_BASE_URL}/api`;
const THUMB_CACHE_KEY = 'audition_video_thumb_v1';

const HostAuditionVideo = ({ navigation: navFromProps }) => {
	const navigation = useNavigation();
	const [video, setVideo] = useState(null); // single video
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [thumb, setThumb] = useState(undefined); // undefined: loading, null: failed, string: uri
	const saveTimerRef = useRef(null);
	const [playerVisible, setPlayerVisible] = useState(false);
	const [isBuffering, setIsBuffering] = useState(false);
	const [playbackError, setPlaybackError] = useState(null);
	const videoRef = React.useRef(null);
	const fetchAbortRef = useRef(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		return () => {
			mountedRef.current = false;
			if (fetchAbortRef.current) fetchAbortRef.current.abort();
			try { StatusBar.setHidden(false, 'fade'); } catch (e) {}
		};
	}, []);

	const safeParseJson = async (res) => {
		const text = await res.text();
		try { return JSON.parse(text); } catch (e) { console.warn('Non-JSON response body:', text.slice(0,200)); throw new Error('Invalid server response'); }
	};

	const fetchVideo = useCallback(async () => {
		if (fetchAbortRef.current) fetchAbortRef.current.abort();
		const controller = new AbortController();
		fetchAbortRef.current = controller;
		try {
			setLoading(true);
			const token = await AuthStorage.getToken();
			if (!token) throw new Error('Not authenticated');
			const res = await fetch(`${apiBase}/audition/video`, {
				headers: { Authorization: `Bearer ${token}` },
				signal: controller.signal,
			});
			if (!res.ok) {
				const body = await res.text();
				console.warn('Fetch audition video non-OK:', res.status, body.slice(0,200));
				throw new Error(`Failed to load (${res.status})`);
			}
			const data = await safeParseJson(res);
			if (!data.success) throw new Error(data.message || 'Failed to load');
			if (controller.signal.aborted || !mountedRef.current) return;
			const v = data.video || null;
			setVideo(v);
			if (v) generateThumb(v.url);
			else setThumb(null);
		} catch (err) {
			if (err.name === 'AbortError') return;
			console.error('fetchVideo error:', err);
			if (mountedRef.current) Alert.alert('Error', err.message || 'Could not load video');
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, []);

	const generateThumb = async (url) => {
		try {
			setThumb(undefined);
			const { uri } = await VideoThumbnails.getThumbnailAsync(url, { time: 0 });
			if (!mountedRef.current) return;
			setThumb(uri);
		} catch (e) {
			console.warn('Thumbnail generation failed', e?.message);
			setThumb(null);
		}
	};

	useEffect(() => {
		(async () => {
			try {
				const raw = await AsyncStorage.getItem(THUMB_CACHE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (parsed && typeof parsed === 'string') setThumb(parsed);
				}
			} catch {}
		})();
	}, []);

	useEffect(() => {
		if (thumb === undefined) return;
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		saveTimerRef.current = setTimeout(async () => {
			try { await AsyncStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(thumb)); } catch {}
		}, 400);
		return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
	}, [thumb]);

	useFocusEffect(useCallback(() => {
		fetchVideo();
		return () => { if (fetchAbortRef.current) fetchAbortRef.current.abort(); };
	}, [fetchVideo]));

	const pickAndUpload = async () => {
		if (video) {
			Alert.alert('Already Uploaded', 'Only one audition video is allowed. Delete it to upload a new one.');
			return;
		}
		try {
			const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', multiple: false, copyToCacheDirectory: true });
			if (result.canceled) return;
			const file = result.assets[0];
			if (file.size && file.size > MAX_SIZE_BYTES) {
				Alert.alert('Too Large', 'Video must be 250MB or less.');
				return;
			}
			await uploadFile(file);
		} catch (err) {
			console.error(err);
			Alert.alert('Error', 'Could not select video');
		}
	};

	const uploadFile = async (file) => {
		try {
			setUploading(true);
			const token = await AuthStorage.getToken();
			const form = new FormData();
			form.append('file', { uri: file.uri, name: file.name || `audition-${Date.now()}.mp4`, type: file.mimeType || 'video/mp4' });
			const res = await fetch(`${apiBase}/audition/video`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
			let data; try { data = await res.json(); } catch { throw new Error('Unexpected server response'); }
			if (!data.success) { Alert.alert('Upload Failed', data.message || 'Upload failed'); return; }
			setVideo(data.auditionVideo);
			try { const { uri } = await VideoThumbnails.getThumbnailAsync(file.uri, { time: 0 }); setThumb(uri); } catch {}
		} catch (err) {
			console.error(err);
			Alert.alert('Error', err.message || 'Upload failed');
		} finally {
			setUploading(false);
		}
	};

	const deleteAudition = async () => {
		if (!video) return;
		Alert.alert('Delete', 'Delete your audition video?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Delete', style: 'destructive', onPress: async () => {
				try {
					const token = await AuthStorage.getToken();
					const res = await fetch(`${apiBase}/audition/video/${video.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
					let data; try { data = await res.json(); } catch { throw new Error('Unexpected server response'); }
					if (!data.success) { Alert.alert('Error', data.message || 'Failed to delete'); return; }
					setVideo(null); setThumb(null);
				} catch (err) {
					console.error(err); Alert.alert('Error', 'Failed to delete video');
				}
			}}
		]);
	};

	const openPlayer = () => { if (video) { setPlaybackError(null); setPlayerVisible(true); } };
	const closePlayer = async () => {
		try { if (videoRef.current) await videoRef.current.unloadAsync(); } catch {}
		setPlayerVisible(false);
		setIsBuffering(false);
		setPlaybackError(null);
	};

		return (
			<View className="flex-1 bg-gray-50">
						<View className="px-4 pt-4 pb-2 flex-row items-center mb-2">
							<TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1">
								<ArrowLeft size={28} color="#111827" weight="bold" />
							</TouchableOpacity>
							<Text className="text-xl font-semibold text-gray-900">My Audition Video</Text>
						</View>
				<Text className="px-4 text-xs text-gray-500 mb-2">{video ? '1/1 video uploaded (max 250MB)' : '0/1 video uploaded (max 250MB)'}</Text>

						{loading ? (
							<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
						) : (
							<View className="flex-1 px-4 pb-8 pt-2">
								{!video ? (
									<View className="mt-10 items-center">
										<Text className="text-gray-500 mb-6">No audition video uploaded yet.</Text>
										<TouchableOpacity
											onPress={pickAndUpload}
											disabled={uploading}
											className={`flex-row items-center px-4 py-3 rounded-lg bg-indigo-600 ${uploading ? 'opacity-60' : ''}`}
											style={{ minWidth: 120, justifyContent: 'center' }}
										>
											{uploading ? <ActivityIndicator size="small" color="#fff" /> : <VideoCamera size={20} color="#fff" weight="bold" />}
											<Text className="text-white ml-2 text-base font-medium">Upload</Text>
										</TouchableOpacity>
									</View>
								) : (
									<TouchableOpacity onPress={openPlayer} className="rounded-xl overflow-hidden bg-gray-900" activeOpacity={0.85} style={{ aspectRatio: 3/4, width: '100%', maxWidth: 320, alignSelf: 'center' }}>
										{thumb === undefined && (
											<View className="flex-1 bg-gray-800 justify-center items-center">
												<ActivityIndicator color="#6366f1" />
												<Text className="text-[10px] text-gray-400 mt-2">Generating preview...</Text>
											</View>
										)}
										{thumb === null && (
											<View className="flex-1 bg-gray-800 justify-center items-center">
												<Play size={34} color="#6366f1" weight="fill" />
												<Text className="text-[10px] text-gray-400 mt-2">Preview unavailable</Text>
											</View>
										)}
										{typeof thumb === 'string' && (
											<Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
										)}
										<View className="absolute top-2 left-2 bg-black/55 px-2 py-1 rounded-md">
											<Text className="text-[10px] text-white">{(video.size / (1024*1024)).toFixed(1)} MB</Text>
										</View>
										<View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
											<View className="flex-row items-center bg-white/20 px-2 py-1 rounded-md">
												<Play size={12} color="#fff" weight="fill" />
												<Text className="text-[10px] text-white ml-1">Tap to Play</Text>
											</View>
											<TouchableOpacity onPress={deleteAudition} disabled={uploading} className="bg-red-600/70 px-2 py-1 rounded-md">
												<Trash size={16} color="#fff" weight="bold" />
											</TouchableOpacity>
										</View>
									</TouchableOpacity>
								)}
							</View>
						)}

				<Modal visible={playerVisible} animationType="fade" statusBarTranslucent onShow={() => StatusBar.setHidden(true, 'fade')} onRequestClose={closePlayer}>
					<View className="flex-1 bg-black">
						{video && (
							<Video ref={videoRef} style={{ flex: 1 }} source={{ uri: video.url }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay progressUpdateIntervalMillis={500}
								onError={(e) => { console.error('Playback error:', e); setPlaybackError('Cannot play this video'); }}
								onLoadStart={() => { setIsBuffering(true); setPlaybackError(null); }} onLoad={() => setIsBuffering(false)}
								onPlaybackStatusUpdate={(status) => { if ('isBuffering' in status) setIsBuffering(status.isBuffering); }} />
						)}
						<View className="absolute top-10 right-4 z-20">
							<Pressable onPress={closePlayer} className="w-10 h-10 rounded-full bg-black/50 justify-center items-center border border-white/20">
								<X size={22} color="#fff" weight="bold" />
							</Pressable>
						</View>
						{(isBuffering && !playbackError) && (
							<View className="absolute inset-0 justify-center items-center bg-black/40">
								<ActivityIndicator size="large" color="#ffffff" />
								<Text className="text-white text-xs mt-3">Loading video...</Text>
							</View>
						)}
						{playbackError && (
							<View className="absolute inset-0 justify-center items-center bg-black/60 px-6">
								<Text className="text-red-400 text-sm font-medium mb-4 text-center">{playbackError}</Text>
								<TouchableOpacity onPress={() => { setPlaybackError(null); setIsBuffering(true); const v = video; setVideo(null); setTimeout(() => setVideo(v), 50); }} className="px-5 py-2 bg-indigo-600 rounded-md">
									<Text className="text-white text-sm font-medium">Retry</Text>
								</TouchableOpacity>
							</View>
						)}
					</View>
				</Modal>
			</View>
		);
};

export default HostAuditionVideo;
