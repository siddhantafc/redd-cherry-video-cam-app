import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Pressable, StatusBar } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { VideoCamera, Trash, X, Play } from 'phosphor-react-native';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'phosphor-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthStorage } from '../../../../utils/authStorage';
import { API_BASE_URL } from '@env';

// Config
const MAX_VIDEOS = 3;
const MAX_SIZE_BYTES = 250 * 1024 * 1024; // 250MB

// Base API (mirror HostImages implementation)
const apiBase = `${API_BASE_URL}/api`;

const THUMB_CACHE_KEY = 'feed_video_thumbs_v1';

const HostVideos = ({ navigation: navFromProps }) => {
	const navigation = useNavigation();
	const [videos, setVideos] = useState([]);
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [thumbs, setThumbs] = useState({}); // id -> local thumbnail uri
	const [thumbQueue, setThumbQueue] = useState([]); // videos pending thumb gen
	const saveTimerRef = useRef(null);
	const [playerVisible, setPlayerVisible] = useState(false);
	const [currentVideo, setCurrentVideo] = useState(null);
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
		try {
			return JSON.parse(text);
		} catch (e) {
			console.warn('Non-JSON response body:', text.slice(0, 200));
			throw new Error('Invalid server response');
		}
	};

	const fetchVideos = useCallback(async () => {
		if (fetchAbortRef.current) {
			fetchAbortRef.current.abort();
		}
		const controller = new AbortController();
		fetchAbortRef.current = controller;
		try {
			setLoading(true);
			const token = await AuthStorage.getToken();
			if (!token) throw new Error('Not authenticated');
			console.log('[HostVideos] Fetching videos...');
			const res = await fetch(`${apiBase}/feed/videos`, {
				headers: { Authorization: `Bearer ${token}` },
				signal: controller.signal,
			});
			if (!res.ok) {
				const body = await res.text();
				console.warn('Fetch videos non-OK:', res.status, body.slice(0,200));
				throw new Error(`Failed to load (${res.status})`);
			}
			const data = await safeParseJson(res);
			if (!data.success) throw new Error(data.message || 'Failed to load');
			if (controller.signal.aborted || !mountedRef.current) return;
			setVideos(data.videos || []);
			// build queue of newly missing thumbs (do not wipe existing queue mid-gen)
			setThumbQueue(prevQueue => {
				const existing = new Set(prevQueue);
				const add = [];
				(data.videos || []).forEach(v => {
					if (!thumbs[v.id] && !existing.has(v.id)) add.push(v.id);
				});
				return [...prevQueue, ...add];
			});
			console.log('[HostVideos] Videos fetched:', (data.videos || []).length);
		} catch (err) {
			if (err.name === 'AbortError') return; // silent
			console.error('fetchVideos error:', err);
			if (mountedRef.current) Alert.alert('Error', err.message || 'Could not load videos');
		} finally {
			if (mountedRef.current) setLoading(false);
		}
	}, [thumbs]);

	// Thumbnail generation effect (process sequentially) OUTSIDE fetchVideos
	useEffect(() => {
		let cancelled = false;
		// avoid spawning generator if nothing queued
		if (thumbQueue.length === 0) return;
		const generateNext = async () => {
			if (cancelled) return;
			if (thumbQueue.length === 0) return;
			const nextId = thumbQueue[0];
			const video = videos.find(v => v.id === nextId);
			if (!video) {
				setThumbQueue(q => q.slice(1));
				return generateNext();
			}
			if (thumbs[nextId]) {
				setThumbQueue(q => q.slice(1));
				return generateNext();
			}
			try {
				const tStart = Date.now();
				// use time 0 for fastest first frame attempt
				const { uri } = await VideoThumbnails.getThumbnailAsync(video.url, { time: 0 });
				if (cancelled) return;
				setThumbs(t => ({ ...t, [nextId]: uri }));
				console.log('Thumbnail generated', nextId, 'in', Date.now() - tStart, 'ms');
			} catch (e) {
				console.warn('Thumbnail generation failed for', nextId, e?.message);
				setThumbs(t => ({ ...t, [nextId]: null }));
			} finally {
				setThumbQueue(q => q.slice(1));
				setTimeout(generateNext, 150); // slightly faster loop
			}
		};
		generateNext();
		return () => { cancelled = true; };
	}, [thumbQueue, videos, thumbs]);

	// Load cached thumbnails once
	useEffect(() => {
		(async () => {
			try {
				const raw = await AsyncStorage.getItem(THUMB_CACHE_KEY);
				if (raw) {
					const parsed = JSON.parse(raw);
					if (parsed && typeof parsed === 'object') {
						setThumbs(parsed);
					}
				}
			} catch (e) {
				console.warn('Failed loading thumbnail cache', e?.message);
			}
		})();
	}, []);

	// Debounced persist of thumbs
	useEffect(() => {
		if (!thumbs || Object.keys(thumbs).length === 0) return;
		if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		saveTimerRef.current = setTimeout(async () => {
			try {
				await AsyncStorage.setItem(THUMB_CACHE_KEY, JSON.stringify(thumbs));
			} catch (e) {
				console.warn('Failed saving thumbnail cache', e?.message);
			}
		}, 400);
		return () => {
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		};
	}, [thumbs]);

	useFocusEffect(
		useCallback(() => {
			let active = true;
			fetchVideos();
			return () => {
				active = false;
				if (fetchAbortRef.current) fetchAbortRef.current.abort();
			};
		}, [fetchVideos])
	);

	const pickAndUpload = async () => {
		if (videos.length >= MAX_VIDEOS) {
			Alert.alert('Limit Reached', 'You can upload a maximum of 3 videos.');
			return;
		}
		try {
			const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', multiple: false, copyToCacheDirectory: true });
			if (result.canceled) return;
			const file = result.assets[0];
			if (file.size && file.size > MAX_SIZE_BYTES) {
				Alert.alert('Too Large', 'Each video must be 250MB or less.');
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
			form.append('file', {
				uri: file.uri,
				name: file.name || `video-${Date.now()}.mp4`,
				type: file.mimeType || 'video/mp4',
			});
			const res = await fetch(`${apiBase}/feed/video`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: form,
			});
			let data; 
			try { data = await res.json(); } catch (e) {
				console.warn('Upload response not JSON');
				throw new Error('Unexpected server response');
			}
			if (!data.success) {
				const msg = data.message || 'Upload failed';
				Alert.alert('Upload Failed', msg);
				return;
			}
			setVideos((prev) => [data.feedVideo, ...prev]);
			try {
				const { uri: localThumb } = await VideoThumbnails.getThumbnailAsync(file.uri, { time: 0 });
				setThumbs(t => ({ ...t, [data.feedVideo.id]: localThumb }));
			} catch (e) {}
		} catch (err) {
			console.error(err);
			Alert.alert('Error', err.message || 'Upload failed');
		} finally {
			setUploading(false);
		}
	};

	const deleteVideo = async (id) => {
		Alert.alert('Delete', 'Are you sure you want to delete this video?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete', style: 'destructive', onPress: async () => {
					try {
						const token = await AuthStorage.getToken();
						const res = await fetch(`${apiBase}/feed/video/${id}`, {
							method: 'DELETE',
							headers: { Authorization: `Bearer ${token}` },
						});
						let data; 
						try { data = await res.json(); } catch (e) {
							console.warn('Delete response not JSON');
							throw new Error('Unexpected server response');
						}
						if (!data.success) {
							Alert.alert('Error', data.message || 'Failed to delete');
							return;
						}
						setVideos((prev) => prev.filter(v => v.id !== id));
					} catch (err) {
						console.error(err);
						Alert.alert('Error', 'Failed to delete video');
					}
				}
			}
		]);
	};

	const openPlayer = (video) => {
		setCurrentVideo(video);
		setPlaybackError(null);
		setPlayerVisible(true);
	};

	const closePlayer = async () => {
		try {
			if (videoRef.current) {
				await videoRef.current.unloadAsync();
			}
		} catch (e) {
			// ignore unload errors
		} finally {
			setPlayerVisible(false);
			setCurrentVideo(null);
			setIsBuffering(false);
			setPlaybackError(null);
		}
	};

	const renderItem = ({ item }) => {
		const thumbUri = thumbs[item.id];
		return (
			<TouchableOpacity
				onPress={() => openPlayer(item)}
				className="mb-6 rounded-xl overflow-hidden bg-gray-900"
				activeOpacity={0.85}
				style={{ aspectRatio: 3/4, width: '100%', maxWidth: 320, alignSelf: 'center' }}
			>
				{thumbUri === undefined && (
					<View className="flex-1 bg-gray-800 justify-center items-center">
						<ActivityIndicator color="#6366f1" />
						<Text className="text-[10px] text-gray-400 mt-2">Generating preview...</Text>
					</View>
				)}
				{thumbUri === null && (
					<View className="flex-1 bg-gray-800 justify-center items-center">
						<Play size={34} color="#6366f1" weight="fill" />
						<Text className="text-[10px] text-gray-400 mt-2">Preview unavailable</Text>
					</View>
				)}
				{thumbUri && (
					<Image source={{ uri: thumbUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
				)}
				{/* Overlay badges */}
				<View className="absolute top-2 left-2 bg-black/55 px-2 py-1 rounded-md">
					<Text className="text-[10px] text-white">{(item.size / (1024*1024)).toFixed(1)} MB</Text>
				</View>
				{/* Replaced gradient utility with static overlay to avoid potential animated node issues */}
				<View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
					<View className="flex-row items-center bg-white/20 px-2 py-1 rounded-md">
						<Play size={12} color="#fff" weight="fill" />
						<Text className="text-[10px] text-white ml-1">Tap to Play</Text>
					</View>
					<TouchableOpacity onPress={() => deleteVideo(item.id)} disabled={uploading} className="bg-red-600/70 px-2 py-1 rounded-md">
						<Trash size={16} color="#fff" weight="bold" />
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

		return (
			<View className="flex-1 bg-gray-50">
				<View className="px-4 pt-4 pb-2 flex-row items-center mb-2">
					<TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1">
						<ArrowLeft size={28} color="#111827" weight="bold" />
					</TouchableOpacity>
					<Text className="text-xl font-semibold text-gray-900">My Videos</Text>
					<View style={{ flex: 1 }} />
					<TouchableOpacity
						onPress={pickAndUpload}
						disabled={uploading || videos.length >= MAX_VIDEOS}
						className={`flex-row items-center px-3 py-2 rounded-md ml-auto ${videos.length >= MAX_VIDEOS ? 'bg-gray-300' : 'bg-indigo-600'}`}
					>
						{uploading ? <ActivityIndicator size="small" color="#fff" /> : <VideoCamera size={20} color="#fff" weight="bold" />}
						<Text className="text-white ml-2 text-sm font-medium">{videos.length >= MAX_VIDEOS ? 'Limit Reached' : 'Upload'}</Text>
					</TouchableOpacity>
				</View>
				<Text className="px-4 text-xs text-gray-500 mb-2">{videos.length}/{MAX_VIDEOS} videos uploaded (max 250MB each)</Text>
				{loading ? (
					<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#4f46e5" /></View>
				) : (
					<FlatList
						data={videos}
						keyExtractor={(item) => (item.id != null ? String(item.id) : Math.random().toString(36))}
						contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}
						renderItem={renderItem}
						removeClippedSubviews
						ListEmptyComponent={!loading && (
							<View className="mt-10 items-center">
								<Text className="text-gray-500">No videos uploaded yet.</Text>
							</View>
						)}
					/>
				)}

				{/* Full-screen Modal Player */}
				<Modal
					visible={playerVisible}
					animationType="fade"
					statusBarTranslucent
					onShow={() => StatusBar.setHidden(true, 'fade')}
					onRequestClose={closePlayer}
				>
					<View className="flex-1 bg-black">
						{/* Video fills screen */}
						{currentVideo && (
							<Video
								ref={videoRef}
								style={{ flex: 1 }}
								source={{ uri: currentVideo.url }}
								useNativeControls
								resizeMode={ResizeMode.CONTAIN}
								shouldPlay
								progressUpdateIntervalMillis={500}
								onError={(e) => {
									console.error('Playback error:', e);
									setPlaybackError('Cannot play this video');
								}}
								onLoadStart={() => { setIsBuffering(true); setPlaybackError(null); }}
								onLoad={() => setIsBuffering(false)}
								onPlaybackStatusUpdate={(status) => {
									if ('isBuffering' in status) setIsBuffering(status.isBuffering);
								}}
							/>
						)}
						{/* Overlay controls */}
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
								<TouchableOpacity
									onPress={() => {
									setPlaybackError(null);
									setIsBuffering(true);
									const v = currentVideo; // reload approach
									setCurrentVideo(null);
									setTimeout(() => setCurrentVideo(v), 50);
								}}
								className="px-5 py-2 bg-indigo-600 rounded-md"
							>
								<Text className="text-white text-sm font-medium">Retry</Text>
								</TouchableOpacity>
							</View>
						)}
						{/* Filename overlay removed for cleaner look; keep size optional if needed */}
					</View>
				</Modal>
			</View>
		);
};

export default HostVideos;
