import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import HostCard from './HostCards';
import HostFilterSearch from './HostFilterSearch';
import { useMemo } from 'react';

export default function UserFeed({
	hosts = [],
	loading = false,
	error = null,
	refreshing = false,
	onRefresh = () => {},
	onHostPress = () => {},
	onVideoCall = () => {},
	searchQuery = '',
	statusFilter = 'all',
	onSearchChange = () => {},
	onStatusChange = () => {},
}) {
	const normalized = useMemo(() => {
		const term = searchQuery?.trim().toLowerCase();
		const filtered = hosts.filter((h) => {
			const key = (h?.name || h?.username || '').toLowerCase();
			const matchesSearch = term ? key.includes(term) : true;
			const statusKey = h?.status ? h.status : h?.is_online ? 'online' : 'offline';
			const matchesFilter = statusFilter === 'all' ? true : statusKey === statusFilter;
			return matchesSearch && matchesFilter;
		});

		// Sort: online first, then busy, then offline; keep stable within groups
		const order = { online: 0, busy: 1, offline: 2 };
		return filtered
			.slice()
			.sort((a, b) => {
				const sa = a?.status ? a.status : a?.is_online ? 'online' : 'offline';
				const sb = b?.status ? b.status : b?.is_online ? 'online' : 'offline';
				const oa = order[sa] ?? 3;
				const ob = order[sb] ?? 3;
				if (oa !== ob) return oa - ob;
				// Secondary sort by name for predictability
				const na = (a?.name || a?.username || '').toLowerCase();
				const nb = (b?.name || b?.username || '').toLowerCase();
				return na.localeCompare(nb);
			});
	}, [hosts, searchQuery, statusFilter]);
	const renderEmptyState = () => (
		<View className="flex-1 items-center justify-center py-20">
			<Text className="text-gray-500 text-lg text-center">No hosts available</Text>
			<Text className="text-gray-400 text-sm text-center mt-2">Pull down to refresh</Text>
		</View>
	);

	const renderError = () => (
		<View className="flex-1 items-center justify-center py-20">
			<Text className="text-red-500 text-lg text-center">Error loading hosts</Text>
			{Boolean(error) && (
				<Text className="text-gray-500 text-sm text-center mt-2">{String(error)}</Text>
			)}
		</View>
	);

	if (loading && !refreshing) {
		return (
			<View className="flex-1 items-center justify-center bg-gray-50">
				<ActivityIndicator size="large" color="#6366f1" />
				<Text className="text-gray-600 mt-2">Loading hosts...</Text>
			</View>
		);
	}

	if (error) {
		return renderError();
	}

		return (
			<>
				<HostFilterSearch
					searchQuery={searchQuery}
					onSearchChange={onSearchChange}
					statusFilter={statusFilter}
					onStatusChange={onStatusChange}
				/>
				<FlatList
				data={normalized}
			keyExtractor={(item, index) => String(item?.id ?? item?._id ?? index)}
			renderItem={({ item }) => (
				<HostCard host={item} onPress={onHostPress} onVideoCall={onVideoCall} />
			)}
			ListEmptyComponent={renderEmptyState}
			refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />}
			contentContainerStyle={{ paddingVertical: hosts.length ? 12 : 0 }}
			/>
			</>
	);
}

