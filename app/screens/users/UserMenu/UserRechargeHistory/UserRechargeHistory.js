import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import AuthenticatedScreenWrapper from '../../../../components/AuthenticatedScreenWrapper';
import UserTopBar from '../../../../components/common/UserTopBar';
import UserBottomBar from '../../../../components/common/UserBottomBar';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../../../../utils/authStorage';
import { ClockCounterClockwise, CheckCircle, XCircle, Hourglass } from 'phosphor-react-native';

const PAGE_SIZE = 5;

const StatusPill = ({ status }) => {
	const map = {
		CAPTURED: { text: 'Captured', color: 'text-green-700', bg: 'bg-green-100', Icon: CheckCircle },
		PROCESSING: { text: 'Processing', color: 'text-amber-700', bg: 'bg-amber-100', Icon: Hourglass },
		CREATED: { text: 'Created', color: 'text-blue-700', bg: 'bg-blue-100', Icon: ClockCounterClockwise },
		FAILED: { text: 'Failed', color: 'text-red-700', bg: 'bg-red-100', Icon: XCircle },
		CANCELLED: { text: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100', Icon: XCircle },
	};
	const { text, color, bg, Icon } = map[status] || map.CREATED;
	return (
		<View className={`flex-row items-center px-2 py-1 rounded-full ${bg}`}>
			<Icon size={14} color={color.includes('green') ? '#166534' : color.includes('red') ? '#991b1b' : color.includes('amber') ? '#92400e' : color.includes('blue') ? '#1d4ed8' : '#374151'} weight="duotone" />
			<Text className={`ml-1 text-[11px] ${color}`}>{text}</Text>
		</View>
	);
};

const Item = ({ item }) => {
	const rupees = (item.amountPaise / 100).toFixed(2);
	const date = new Date(item.createdAt);
	return (
		<View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
			<View className="flex-row items-center justify-between">
				<Text className="text-xl font-extrabold text-gray-900">₹{rupees}</Text>
				<StatusPill status={item.status} />
			</View>
			<Text className="text-gray-500 mt-1">Order: {item.razorpayOrderId || '—'}</Text>
			<Text className="text-gray-500">Payment: {item.razorpayPaymentId || '—'}</Text>
			<Text className="text-gray-400 text-xs mt-1">{date.toLocaleString()}</Text>
		</View>
	);
};

const UserRechargeHistory = () => {
	const navigation = useNavigation();
	const [items, setItems] = useState([]);
	const [nextCursor, setNextCursor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const fetchPage = useCallback(async (cursor) => {
		const token = await AuthStorage.getToken();
		const params = new URLSearchParams();
		params.set('limit', String(PAGE_SIZE));
		if (cursor) params.set('cursor', cursor);
		const res = await fetch(`${API_BASE_URL}/api/payments/history?${params.toString()}`, {
			headers: { 'Authorization': `Bearer ${token}` },
		});
		if (!res.ok) throw new Error('Failed to load history');
		return res.json();
	}, []);

	const loadInitial = useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetchPage(null);
			setItems(data.items || []);
			setNextCursor(data.nextCursor || null);
		} catch (e) {
			// Optionally toast
		} finally {
			setLoading(false);
		}
	}, [fetchPage]);

	const onRefresh = useCallback(async () => {
		try {
			setRefreshing(true);
			const data = await fetchPage(null);
			setItems(data.items || []);
			setNextCursor(data.nextCursor || null);
		} catch (e) {
			// ignore
		} finally {
			setRefreshing(false);
		}
	}, [fetchPage]);

	const loadMore = useCallback(async () => {
		if (!nextCursor || loadingMore) return;
		try {
			setLoadingMore(true);
			const data = await fetchPage(nextCursor);
			setItems((prev) => [...prev, ...(data.items || [])]);
			setNextCursor(data.nextCursor || null);
		} catch (e) {
			// ignore
		} finally {
			setLoadingMore(false);
		}
	}, [nextCursor, loadingMore, fetchPage]);

	useEffect(() => {
		loadInitial();
	}, [loadInitial]);

	return (
		<AuthenticatedScreenWrapper>
			<View className="flex-1 bg-gray-50">
				<UserTopBar />
				<View className="flex-1 px-6 pt-4">
					<Text className="text-2xl font-bold text-gray-900 mb-3">Recharge History</Text>
					{loading ? (
						<View className="flex-1 items-center justify-center">
							<ActivityIndicator color="#6366f1" />
							<Text className="text-gray-500 mt-2">Loading...</Text>
						</View>
					) : (
						<FlatList
							data={items}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => <Item item={item} />}
							contentContainerStyle={{ paddingBottom: 80 }}
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
							onEndReachedThreshold={0.4}
							onEndReached={loadMore}
							ListFooterComponent={loadingMore ? (
								<View className="py-3">
									<ActivityIndicator color="#6366f1" />
								</View>
							) : !nextCursor && items.length > 0 ? (
								<View className="py-3 items-center">
									<Text className="text-gray-400 text-xs">No more records</Text>
								</View>
							) : null}
							ListEmptyComponent={
								<View className="flex-1 items-center justify-center py-20">
									<Text className="text-gray-500">No transactions yet</Text>
								</View>
							}
						/>
					)}
				</View>
				<UserBottomBar navigation={navigation} activeTab="Menu" />
			</View>
		</AuthenticatedScreenWrapper>
	);
};

export default UserRechargeHistory;

