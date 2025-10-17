import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "phosphor-react-native";

const HostAppGuide = () => {
  const navigation = useNavigation();
  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-4 pb-2 mb-2">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-2 p-1"
        >
          <ArrowLeft size={28} color="#111827" weight="bold" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">
          App Guide for Host
        </Text>
      </View>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            ধাপে ধাপে নির্দেশনা:
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Text className="text-base font-bold text-blue-700 mr-2">1.</Text>
              <Text className="text-base text-gray-800 flex-1">
                রেজিস্টার করার জন্য আপনার ছবি, সরকারি আইডি প্রুফ, নাম, মোবাইল,
                ইমেল, পাসওয়ার্ড এবং পিন ব্যবহার করে সাইনআপ করতে হবে এবং
                রেজিস্টার সম্পন্ন করতে হবে।
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-base font-bold text-blue-700 mr-2">2.</Text>
              <Text className="text-base text-gray-800 flex-1">
                তারপর ইউজার এবং পাসওয়ার্ড ব্যবহার করে লগইন করতে হবে।
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-base font-bold text-blue-700 mr-2">3.</Text>
              <Text className="text-base text-gray-800 flex-1">
                তারপর আমার প্রোফাইল বিভাগে প্রোফাইল ইনফো বক্সে আপনার সকল
                ব্যক্তিগত তথ্য সম্পন্ন করতে প্রোফাইল ঠিক করতে হবে।
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-base font-bold text-blue-700 mr-2">4.</Text>
              <Text className="text-base text-gray-800 flex-1">
                প্রোফাইল ঠিক করার পরে হোমপেজে গিয়ে ভিডিও কল রিসিভ করার জন্য
                অপশন দেখতে পারবেন, এবং ইনকাম সম্পর্কিত তথ্য দেখতে পারবেন।
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-base font-bold text-blue-700 mr-2">5.</Text>
              <Text className="text-base text-gray-800 flex-1">
                প্রোফাইল ফটো যুক্ত করার জন্য My Photos and Videos এ গিয়ে আপনার
                ইচ্ছেমতো ছবি এবং ভিডিও আপলোড করতে পারবেন এবং যদি ভিডিও কল করতে
                চান তাহলে Add Video অপশনে যেতে হবে।
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-base text-gray-900 font-semibold mb-2">
          Profile Integration Instructions:
        </Text>
        <View className="space-y-3 mb-2">
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">1.</Text>
            <Text className="text-base text-gray-800 flex-1">First, register with your details in the <Text className="font-semibold text-blue-700">Signup Screen</Text>.</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">2.</Text>
            <Text className="text-base text-gray-800 flex-1">Open the App Guide page, read all instructions, click <Text className="font-semibold text-blue-700">Enter</Text>, select one or more interests, and press <Text className="font-semibold text-blue-700">Continue</Text>.</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">3.</Text>
            <Text className="text-base text-gray-800 flex-1">Go to the Profile section → <Text className="font-semibold text-blue-700">My Profile</Text> to edit your details and profile picture, then click <Text className="font-semibold text-blue-700">Save</Text> to store them permanently.</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">4.</Text>
            <Text className="text-base text-gray-800 flex-1">Next, visit the <Text className="font-semibold text-blue-700">KYC Details</Text> page to check your details and upload a selfie.</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">5.</Text>
            <Text className="text-base text-gray-800 flex-1">After completing this, go to the <Text className="font-semibold text-blue-700">Host Details</Text> page to verify that your picture is visible.</Text>
          </View>
          <View className="flex-row items-start">
            <Text className="text-base font-bold text-blue-700 mr-2">6.</Text>
            <Text className="text-base text-gray-800 flex-1">You can log out anytime from the Profile section by clicking <Text className="font-semibold text-blue-700">Logout</Text>.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HostAppGuide;
