import React from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';

const FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'online', label: 'Online' },
	{ key: 'busy', label: 'Busy' },
	{ key: 'offline', label: 'Offline' },
];

export default function HostFilterSearch({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusChange,
}) {
	return (
		<View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
			{/* Search */}
			<View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-0">
				<MagnifyingGlass size={20} color="#6b7280" />
				<TextInput
					placeholder="Search hosts by name"
					placeholderTextColor="#9ca3af"
					value={searchQuery}
					onChangeText={onSearchChange}
					className="ml-2 flex-1 text-gray-900"
					returnKeyType="search"
				/>
				{searchQuery?.length > 0 && (
					<TouchableOpacity onPress={() => onSearchChange('')}>
						<Text className="text-indigo-600 font-medium">Clear</Text>
					</TouchableOpacity>
				)}
			</View>

			{/* Filters */}
			<View className="flex-row mt-3">
				{FILTERS.map((f) => {
					const selected = f.key === statusFilter;
					return (
						<TouchableOpacity
							key={f.key}
							onPress={() => onStatusChange(f.key)}
							className={`mr-2 px-3 py-1.5 rounded-full border ${
								selected
									? 'bg-pink-50 border-pink-200'
									: 'bg-white border-gray-200'
							}`}
							activeOpacity={0.8}
						>
							<Text
								className={`${
									selected ? 'text-pink-700' : 'text-gray-700'
								} text-sm font-medium`}
							>
								{f.label}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>
		</View>
	);
}

