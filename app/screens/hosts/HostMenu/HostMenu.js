import HostMyPaymentSection from "../../../components/host/menu/HostMyPaymentsSection";
import React from "react";
import { View, Text } from "react-native";
import { ImageSquareIcon, VideoCameraIcon } from "phosphor-react-native";
import HostMyProfileSection from "../../../components/host/menu/HostMyProfileSection";
import HostTopBar from "../../../components/common/HostTopBar";
import HostBottomBar from "../../../components/common/HostBottomBar";
import MenuProfileInformation from "../../../components/host/menu/MenuProfileInformation";
import HostMiscSection from "../../../components/host/menu/HostMiscSection";

import { ScrollView } from "react-native";
import HostSettingsSection from "../../../components/host/menu/HostSettingsSection";

const HostMenu = ({ navigation }) => (
  <View className="flex-1 bg-gray-50">
    <HostTopBar />
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <MenuProfileInformation />
      {/* My Profile Section */}
      <HostMyProfileSection navigation={navigation} />
      <HostMyPaymentSection navigation={navigation} />
      <HostMiscSection navigation={navigation} />
      <HostSettingsSection navigation={navigation} />
    </ScrollView>
    <HostBottomBar navigation={navigation} activeTab="Menu" />
  </View>
);

export default HostMenu;
