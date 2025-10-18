import React, { useState } from "react";
import { Image } from "react-native";
import logo from "../../assets/images/logo_trans_512.png";
import logo2 from "../../assets/images/friendsclub_logo_512.png";
import { View, Text, TextInput, TouchableOpacity, Switch } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import CopyrightFooter from "../../components/common/CopyrightFooter";
import { API_BASE_URL } from "@env";
import { Eye, EyeSlash } from 'phosphor-react-native';

const HostSignUpForm = ({
  navigation,
  email,
  setEmail,
  phone,
  setPhone,
  agencyCode,
  setAgencyCode,
  dob,
  setDob,
  gender,
  setGender,
  isPremium,
  setIsPremium,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  passwordsMatch,
  name,
  setName,
}) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    // Always format as YYYY-MM-DD
    const formatted =
      date instanceof Date ? date.toISOString().split("T")[0] : "";
    setDob(formatted);
    hideDatePicker();
  };

  // Signup handler
  const handleSignUp = async () => {
    try {
      const payload = {
        email,
        name: name,
        phone,
        password,
        is_premium: isPremium,
        agency_code: agencyCode,
        dob,
        gender,
      };
      console.log("Host signup payload:", payload);
      const response = await fetch(`${API_BASE_URL}/api/auth/host/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // If response is not JSON
        data = {};
      }
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Host registered successfully!",
        });
        setTimeout(() => navigation.navigate("Login"), 1200);
      } else if (response.status === 409) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Host with this email or phone already exists",
        });
      } else if (response.status === 400) {
        Toast.show({
          type: "error",
          text1: "Invalid Input",
          text2: data.message || "Please check your input and try again.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Registration failed",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred. Please try again.",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={24}
    >
      <View className="flex-row gap-8 mb-4">
        <Image
          source={logo}
          style={{ width: 60, height: 60 }}
          resizeMode="contain"
          accessibilityLabel="Let's Talk Logo"
        />
        <Image
          source={logo2}
          style={{ width: 60, height: 60}}
          resizeMode="contain"
          accessibilityLabel="Let's Talk Logo"
        />
      </View>

      <Text className="text-3xl font-bold text-primary mb-2">Host Sign Up</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        className="mb-6"
      >
        <Text className="text-black text-sm">
          Already have an account? <Text className="text-pink-500 underline">Sign in</Text>
        </Text>
      </TouchableOpacity>
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Name</Text>
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Email</Text>
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Phone</Text>
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Phone"
        placeholderTextColor="#aaa"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Agency Code (Optional)</Text>
      <TextInput
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
        placeholder="Agency Code (optional)"
        placeholderTextColor="#aaa"
        value={agencyCode}
        onChangeText={setAgencyCode}
      />
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Date of Birth</Text>
      <TouchableOpacity
        className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-base"
        onPress={showDatePicker}
        activeOpacity={0.8}
        style={{ justifyContent: "center" }}
      >
        <Text style={{ color: dob ? "#222" : "#aaa" }}>
          {dob ? dob : "Date of Birth"}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        maximumDate={new Date()}
      />
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Gender</Text>
      <View className="w-full mb-4 px-4 border border-gray-200 rounded-lg bg-gray-50">   
        <Picker
          selectedValue={gender}
          onValueChange={setGender}
          style={{ color: gender ? "#222" : "#aaa" }}
          dropdownIconColor="#aaa"
        >
          <Picker.Item label="Select Gender" value="" color="#aaa" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>
      <View className="w-full flex-row items-center mb-4">
        <Text className="text-base mr-2 text-gray-900">Premium Host?</Text>
        <Switch value={isPremium} onValueChange={setIsPremium} />
      </View>
      {/* Password with toggle */}
      <Text className="self-start mb-1 ml-1 text-gray-600 font-sm">Password</Text>
      <View className="w-full mb-1 relative">
        <TextInput
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg bg-gray-50 text-base text-gray-900"
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <Text className="self-start mt-2 mb-1 ml-1 text-gray-600 font-sm">Confirm Password</Text>
        <View className="absolute right-3 inset-y-0 justify-center">
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            className="p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeSlash size={22} color="#6b7280" weight="regular" />
            ) : (
              <Eye size={22} color="#6b7280" weight="regular" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password with toggle */}
      <View className="w-full mb-2 relative">
        <TextInput
          className={`w-full px-4 py-3 pr-12 border rounded-lg bg-gray-50 text-base text-gray-900 ${!passwordsMatch ? "border-red-400" : "border-gray-200"}`}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <View className="absolute right-3 inset-y-0 justify-center">
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((v) => !v)}
            accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            className="p-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showConfirmPassword ? (
              <EyeSlash size={22} color="#6b7280" weight="regular" />
            ) : (
              <Eye size={22} color="#6b7280" weight="regular" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {!passwordsMatch && (
        <Text className="w-full text-red-500 mb-2 text-sm">
          Passwords do not match
        </Text>
      )}
      <TouchableOpacity
        className="w-full bg-primary py-3 rounded-lg items-center shadow-md active:opacity-80 mb-4 mt-4"
        disabled={!passwordsMatch}
        onPress={handleSignUp}
      >
        <Text className=" text-white text-lg font-semibold">Sign Up</Text>
      </TouchableOpacity>
      <CopyrightFooter />
    </KeyboardAwareScrollView>
  );
};

export default HostSignUpForm;
