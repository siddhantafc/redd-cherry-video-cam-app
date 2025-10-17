import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from "phosphor-react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Picker } from '@react-native-picker/picker';
import { AuthStorage } from "../../../../utils/authStorage";
import { API_BASE_URL } from "@env";

const HostBankDetails = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(null);
  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    accountType: "savings",
  });

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const token = await AuthStorage.getToken();
      const res = await fetch(`${API_BASE_URL}/api/bank/get-details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        setDetails(null);
      } else {
        const data = await res.json();
        if (res.ok && data.details) {
          setDetails(data.details);
          setForm({
            accountHolderName: data.details.accountHolderName || "",
            accountNumber: data.details.accountNumber || "",
            bankName: data.details.bankName || "",
            ifscCode: data.details.ifscCode || "",
            accountType: data.details.accountType || "savings",
          });
        } else {
          setError(data.error || "Failed to fetch details");
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await AuthStorage.getToken();
      const payload = { ...form };
      const res = await fetch(`${API_BASE_URL}/api/bank/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert("Success", "Bank details saved successfully");
        setDetails(data.details);
      } else {
        setError(data.message || data.error || "Failed to save details");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraHeight={Platform.OS === 'ios' ? 20 : 80}
      extraScrollHeight={20}
      keyboardOpeningTime={0}
      contentContainerStyle={{ paddingVertical: 24 }}
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View className="px-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 p-1">
            <ArrowLeft size={28} color="#111827" weight="bold" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Bank Details</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View>
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            {/* ...existing code for form fields and button... */}
            <Text className="mb-1 text-gray-700">Account Holder Name</Text>
            <TextInput
              value={form.accountHolderName}
              onChangeText={(v) => handleChange("accountHolderName", v)}
              placeholder="Account Holder Name"
              className="border border-gray-300 rounded-lg mb-3 px-3 py-2 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ textAlignVertical: "center", height: 48 }}
            />

            <Text className="mb-1 text-gray-700">Account Number</Text>
            <TextInput
              value={form.accountNumber}
              onChangeText={(v) => handleChange("accountNumber", v)}
              placeholder="Account Number"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg mb-3 px-3 py-2 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ textAlignVertical: "center", height: 48 }}
            />

            <Text className="mb-1 text-gray-700">Bank Name</Text>
            <TextInput
              value={form.bankName}
              onChangeText={(v) => handleChange("bankName", v)}
              placeholder="Bank Name"
              className="border border-gray-300 rounded-lg mb-3 px-3 py-2 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ textAlignVertical: "center", height: 48 }}
            />

            <Text className="mb-1 text-gray-700">IFSC Code</Text>
            <TextInput
              value={form.ifscCode}
              onChangeText={(v) => handleChange("ifscCode", v)}
              placeholder="IFSC Code"
              autoCapitalize="characters"
              className="border border-gray-300 rounded-lg mb-3 px-3 py-2 text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              style={{ textAlignVertical: "center", height: 48 }}
            />

            <Text className="mb-1 text-gray-700">Account Type</Text>
            <View className="border border-gray-300 rounded-lg mb-6 overflow-hidden justify-center" style={{ height: 48 }}>
              <Picker
                selectedValue={form.accountType}
                onValueChange={(v) => handleChange("accountType", v)}
                style={{ height: 48, justifyContent: 'center', color: '#111827' }}
                itemStyle={{ fontSize: 16, textAlign: 'center', height: 48 }}
                dropdownIconColor="#2563eb"
              >
                <Picker.Item label="Savings" value="savings" style={{ textAlign: 'center', height: 48 }} />
                <Picker.Item label="Current" value="current" style={{ textAlign: 'center', height: 48 }} />
              </Picker>
            </View>

            <TouchableOpacity
              className={`bg-blue-600 rounded-lg py-3 items-center ${saving ? 'opacity-60' : ''}`}
              onPress={handleSubmit}
              disabled={saving}
            >
              <Text className="text-white text-base font-semibold">{saving ? 'Saving...' : 'Save Details'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};

export default HostBankDetails;
