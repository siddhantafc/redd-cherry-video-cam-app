import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
} from "react-native";
import {
  Lightning,
  Timer,
  ArrowRight,
  CrownSimple,
  WhatsappLogo,
} from "phosphor-react-native";
import AuthenticatedScreenWrapper from "../../../../components/AuthenticatedScreenWrapper";
import UserTopBar from "../../../../components/common/UserTopBar";
import UserBottomBar from "../../../../components/common/UserBottomBar";
import { useNavigation } from "@react-navigation/native";
import RazorpayCheckout from "react-native-razorpay";
import Toast from "react-native-toast-message";
import { API_BASE_URL } from "@env";
import { AuthStorage } from "../../../../utils/authStorage";
import { useWalletBalance } from "../../../../contexts/WalletBalanceContext";
import CopyrightFooter from "../../../../components/common/CopyrightFooter";

const UserRecharge = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const { refreshBalance } = useWalletBalance();

  const SLABS = [
    24, 50, 100, 200, 500, 800, 1600, 2800, 4500, 8900, 17800, 35600,
  ];
  const recommend = new Set([500, 1600]);
  const premium = new Set([17800, 35600]);

  const openWhatsApp = async () => {
    const url = "https://wa.me/8240210845";
    try {
      await Linking.openURL(url);
    } catch (e) {
      Toast.show({ type: "error", text1: "Could not open WhatsApp" });
    }
  };

  const secondsFromRupees = (rupees) => Math.floor(rupees / 0.4); // 0.4 ₹ / sec
  const prettyDuration = (secs) => {
    const totalMinutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes > 0) {
        return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`;
      }
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }
    if (totalMinutes > 0) {
      return `${totalMinutes} min${totalMinutes > 1 ? 's' : ''}${seconds ? ` ${seconds}s` : ''}`;
    }
    return `${seconds} sec`;
  };

  const handlePay = async (rupees) => {
    try {
      setLoading(true);
      setSelected(rupees);
      const token = await AuthStorage.getToken();
      if (!token) {
        Toast.show({ type: "error", text1: "Not authenticated" });
        setLoading(false);
        return;
      }

      const amountPaise = Math.round(rupees * 100);
      const res = await fetch(`${API_BASE_URL}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: amountPaise }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "Failed to create order");
      }

      const data = await res.json();
      const { order, paymentId, estimatedMinutes } = data;

      const user = await AuthStorage.getUser();
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Friend's Club",
        description: `Recharge ₹${(order.amount / 100).toFixed(2)}`,
        order_id: order.id,
        prefill: {
          name: user?.name || user?.username || "User",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#f74e8f" },
      };

      let razor = null;
      try {
        razor = await RazorpayCheckout.open(options);
      } catch (e) {
        // User likely dismissed/cancelled checkout; mark payment as CANCELLED
        try {
          const cancelRes = await fetch(`${API_BASE_URL}/api/payments/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ razorpay_order_id: order.id }),
          });
          await cancelRes.json().catch(() => ({}));
        } catch {}
        throw e;
      }
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = razor || {};

      // Verify payment
      const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
        }),
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        throw new Error(verifyData?.error || "Payment verification failed");
      }

      Toast.show({
        type: "success",
        text1: "Payment initiated",
        text2:
          verifyData?.status === "queued"
            ? "We will credit your minutes shortly"
            : "Payment captured",
      });

      // Proactively refresh the wallet balance so UI reflects credit without reload
      try { await refreshBalance(); } catch {}

      // If processing is queued, perform a short retry loop to catch the credit once worker completes
      if (verifyData?.status === 'queued') {
        try {
          for (let i = 0; i < 8; i++) { // ~8 seconds of retry
            await new Promise((r) => setTimeout(r, 1000));
            await refreshBalance();
          }
        } catch {}
      }

      // Optionally navigate to history or back to menu
      navigation.navigate("UserMenu");
    } catch (err) {
      const message = err?.message || "Payment cancelled or failed";
      Toast.show({ type: "error", text1: "Payment error", text2: message });
    } finally {
      setLoading(false);
      setSelected(null);
    }
  };

  return (
    <AuthenticatedScreenWrapper>
      <View className="flex-1 bg-gray-50">
        <UserTopBar />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 24,
            paddingHorizontal: 24,
            paddingBottom: 0,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-2xl font-bold text-gray-900">Recharge</Text>
          <Text className="text-gray-600 mt-1">
            Choose a pack to add minutes
          </Text>

          <View className="mt-4">
            <View>
              {SLABS.map((amt) => {
                const secs = secondsFromRupees(amt);
                const label = prettyDuration(secs);
                const isSelected = selected === amt && loading;
                const isRecommended = recommend.has(amt);
                const isPremium = premium.has(amt);
                return (
                  <TouchableOpacity
                    key={amt}
                    className={`w-full mb-3 ${
                      isPremium
                        ? isSelected
                          ? "border-amber-500"
                          : "border-amber-300"
                        : isSelected
                          ? "border-purple-600"
                          : "border-gray-200"
                    } ${isPremium ? "bg-amber-50" : "bg-white"} border rounded-2xl p-4 shadow-sm`}
                    activeOpacity={0.85}
                    disabled={loading}
                    onPress={() => handlePay(amt)}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-full items-center justify-center ${isPremium ? "bg-amber-100" : "bg-purple-50"}`}
                      >
                        {isPremium ? (
                          <CrownSimple
                            size={24}
                            color="#f59e0b"
                            weight="duotone"
                          />
                        ) : (
                          <Lightning
                            size={24}
                            color="#6366f1"
                            weight="duotone"
                          />
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-2xl font-extrabold text-gray-900">
                            ₹{amt}
                          </Text>
                          {isRecommended ? (
                            <Text className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              Value Call Pack
                            </Text>
                          ) : null}
                          {isPremium ? (
                            <Text className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Premium
                            </Text>
                          ) : null}
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Timer size={16} color="#6b7280" weight="regular" />
                          <Text className="ml-1 text-gray-500">≈ {label}</Text>
                        </View>
                        {isPremium ? (
                          <TouchableOpacity
                            className="mt-2 flex-row items-center"
                            activeOpacity={0.8}
                            onPress={openWhatsApp}
                          >
                            <WhatsappLogo
                              size={18}
                              color="#25D366"
                              weight="duotone"
                            />
                            <Text className="ml-2 text-[12px] text-green-700 underline">
                              Premium Services talk to admin
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <View className="ml-3 min-w-[24px] items-end justify-center">
                        {isSelected ? (
                          <ActivityIndicator
                            color={isPremium ? "#f59e0b" : "#6366f1"}
                          />
                        ) : (
                          <ArrowRight
                            size={20}
                            color={isPremium ? "#f59e0b" : "#6366f1"}
                            weight="bold"
                          />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mt-2">
              <Text className="text-xs text-gray-500">
                Rate: ₹0.40 ≈ 1 second (approx)
              </Text>
              <Text className="text-[11px] text-gray-400 mt-1">
                Payments are processed securely via Razorpay.
              </Text>
            </View>
          </View>
          <CopyrightFooter style={{ marginTop: 32 }} />
        </ScrollView>
        <UserBottomBar navigation={navigation} activeTab="Menu" />
      </View>
    </AuthenticatedScreenWrapper>
  );
};

export default UserRecharge;
