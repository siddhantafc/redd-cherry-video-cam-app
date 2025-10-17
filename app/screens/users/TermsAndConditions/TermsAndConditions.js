// ...existing code...
// ...existing code...
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { CaretDown, CaretUp, ArrowLeft } from "phosphor-react-native";
import CopyrightFooter from '../../../components/common/CopyrightFooter';


// Recursively enforce readable text color (in case global Text default is white)
const enforceTextColor = (nodes, color = '#111') => {
  return React.Children.map(nodes, (child) => {
    if (!React.isValidElement(child)) return child;
    // If this element is a Text component, merge color
    if (child.type === Text) {
      const existingStyle = child.props.style;
      return React.cloneElement(child, {
        style: [existingStyle, { color }]
      });
    }
    // Recurse into its children (for nested Views)
    if (child.props && child.props.children) {
      return React.cloneElement(child, {
        children: enforceTextColor(child.props.children, color)
      });
    }
    return child;
  });
};

const Accordion = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ marginBottom: 16, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 1 }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f3f4f6' }}
      >
        <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 18, color: '#222' }}>{title}</Text>
        {expanded ? <CaretUp size={22} color="#888" /> : <CaretDown size={22} color="#888" />}
      </TouchableOpacity>
      {expanded && (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
          {enforceTextColor(children)}
        </View>
      )}
    </View>
  );
};

const TermsAndConditions = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginRight: 8 }}>
          <ArrowLeft size={24} color="#222" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#222', flex: 1 }}>Terms & Condition</Text>
      </View>
  <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Accordion title="Privacy Policy">
          <Text style={{ marginBottom: 8 }}>
            At Friends Club, your privacy is very important to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our platform, which includes our social networking features, friend-matching tools, and online gaming services (excluding casino or gambling content).
            {"\n"}
            By using our Services, you agree to the practices described in this Privacy Policy. This policy is designed to be compliant with common privacy regulations like GDPR, CCPA, and India's IT Act, 2000
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Information We Collect</Text>
          <Text style={{ marginBottom: 8 }}>
            We collect the following types of information:{"\n"}
            a. Personal Information
            When you register or use our Services, we may collect:{"\n"}
            Full name, Date of birth, Email address, Phone number (optional), Profile photo and bio, Location (if permission is granted), Login credentials (encrypted)
          </Text>
          <Text style={{ marginBottom: 8 }}>
            b. Usage Information
            We collect data about how you use the platform: Games played, Friends and social interactions, Messages (not shared or sold), Content you post (photos, status updates, etc.)
          </Text>
          <Text style={{ marginBottom: 8 }}>
            c. Device & Technical Information
            IP address, Browser type, Operating system, Device type, Log files and crash data
          </Text>
          <Text style={{ marginBottom: 8 }}>
            d. In-App Purchases (if applicable)
            Payment details are handled by third-party payment processors. We do not store full credit card or payment information.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>How We Use Your Information</Text>
          <Text style={{ marginBottom: 8 }}>
            We use your data to:
            Create and manage your account, Recommend games, content, or users, Ensure platform safety and prevent abuse, Send important updates, service notifications, and offers (you can opt-out of marketing)
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>How We Share Your Information</Text>
          <Text style={{ marginBottom: 4 }}>We do not sell your personal information. We may share data only in the following circumstances:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• With other users based on your profile visibility settings</Text>
            <Text>• With service providers (e.g., hosting, analytics, payment gateways)</Text>
            <Text>• With law enforcement or authorities if legally required</Text>
            <Text>• With affiliates or business partners during mergers or acquisitions (you will be notified)</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Your Privacy Choices</Text>
          <Text style={{ marginBottom: 4 }}>You can:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• View, update, or delete your personal information</Text>
            <Text>• Delete your account at any time</Text>
            <Text>• Opt-out of promotional emails and notifications</Text>
            <Text>• Control profile visibility (public, friends-only, private)</Text>
            <Text>For data deletion requests, email us at [customercare@clientfriendcluubs.com].</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Data Security</Text>
          <Text style={{ marginBottom: 4 }}>We use industry-standard security practices to protect your data, including:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Encrypted connections (HTTPS)</Text>
            <Text>• Secure server infrastructure</Text>
            <Text>• Access controls and regular audits</Text>
            <Text>However, no system is 100% secure. Please use strong passwords and protect your login details.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Children Privacy</Text>
          <Text style={{ marginBottom: 8 }}>Our Services are not intended for users under 18. If we become aware that a child under 18 has registered, we will delete their account and data promptly.</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Data Retention</Text>
          <Text style={{ marginBottom: 4 }}>We retain your personal data only for as long as necessary:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• To provide our services</Text>
            <Text>• To comply with legal obligations</Text>
            <Text>• To resolve disputes or enforce policies</Text>
            <Text>You may request early deletion of your data at any time.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>International Users</Text>
          <Text style={{ marginBottom: 8 }}>If you are accessing Friends Club from outside your country of residence, you consent to your information being transferred and processed in that region.</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Changes to This Policy</Text>
          <Text style={{ marginBottom: 4 }}>We may update this Privacy Policy occasionally. When we do, we will:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Notify users via email or app notification (for significant changes)</Text>
            <Text>• Update the "Effective Date" above</Text>
            <Text>Your continued use of the platform signifies your acceptance of the revised policy.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Contact Us</Text>
          <Text style={{ marginBottom: 4 }}>If you have questions, concerns, or data-related requests, contact:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Friends Club – Privacy Officer</Text>
            <Text>• Email: customercare@clientfriendcluubs.com</Text>
            <Text>• Address: [Holding No :- 372, WEST TOWER, 11 W 2 ROOM NO. 22, ACTION AREA 1, IIF, NEW TOWN, CHAKPACHURIA , District :- North 24 Parganas, Pincode :- 700156 in ward no. 11</Text>
          </View>
        </Accordion>
        <Accordion title="Refund Policy">
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Effective Date: 29-06-2025</Text>
          <Text style={{ marginBottom: 8 }}>
            At Friends Club, we aim to ensure you have a positive and fair experience on our platform. This Refund Policy outlines the terms under which purchases made on our platform are eligible for a refund.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Digital Goods & In-App Purchases</Text>
          <Text style={{ marginBottom: 4 }}>
            All purchases made for digital content, in-game items, or upgrades on Friends Club are non-refundable, except in the following cases:
          </Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Eligible for Refund:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You were charged multiple times for the same purchase due to a technical error.</Text>
            <Text>• You made a purchase without receiving the item or feature due to a system malfunction.</Text>
            <Text>• Your account was compromised and purchases were made fraudulently (with proof and investigation).</Text>
          </View>
          <Text style={{ fontWeight: 'bold' }}>Not Eligible for Refund:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You changed your mind after purchase.</Text>
            <Text>• You made the purchase by mistake.</Text>
            <Text>• You no longer want or use the purchased item or feature.</Text>
            <Text>• In-game items or credits that have been partially used or consumed.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Subscription Plans (if applicable)</Text>
          <Text style={{ marginBottom: 4 }}>
            If you purchased a subscription plan (e.g., Friends Club Premium):
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You may cancel anytime, but no partial refunds are provided for unused time in the billing cycle.</Text>
            <Text>• If a subscription renewal was processed in error, contact us within 48 hours of charge to request a refund.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>How to Request a Refund</Text>
          <Text style={{ marginBottom: 4 }}>To request a refund:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Email us at customercare@clientfriendcluubs.com</Text>
            <Text>• Include:</Text>
            <Text>  - Your username/email ID</Text>
            <Text>  - Transaction ID or receipt</Text>
            <Text>  - Reason for refund request</Text>
          </View>
          <Text style={{ marginBottom: 8 }}>
            We will respond within 5 business days and process eligible refunds within 7–10 business days, depending on your payment method.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Third-Party Platforms</Text>
          <Text style={{ marginBottom: 8 }}>
            If you made a purchase through a third-party platform (e.g., Google Play or Apple App Store), their refund policies apply, and you must contact them directly.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Policy Updates</Text>
          <Text style={{ marginBottom: 8 }}>
            We reserve the right to update this Refund Policy at any time. Updates will be posted on this page. Continued use of the platform after changes implies acceptance of the updated policy.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Contact Us</Text>
          <Text style={{ marginBottom: 4 }}>For all refund-related questions or issues:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Email: customercare@clientfriendcluubs.com</Text>
            <Text>• Email: [customercare@clientfriendcluubs.com]</Text>
            <Text>• Address: [Holding No :- 372, WEST TOWER, 11 W 2 ROOM NO. 22, ACTION AREA 1, IIF, NEW TOWN, CHAKPACHURIA , District :- North 24 Parganas, Pincode :- 700156 in ward no. 11]</Text>
          </View>
        </Accordion>
        <Accordion title="Terms of Use">
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Effective Date: 29-06-2025</Text>
          <Text style={{ marginBottom: 8 }}>
            Welcome to [FRIENDS CLUB] ("we", "us", "our"). These Terms of Use (“Terms”) govern your use of our online platform, including our social networking features, friendship-building tools, and non-casino gaming services (collectively, the “Services”).
            {"\n"}
            By accessing or using our platform (web or mobile), you agree to be bound by these Terms. If you do not agree, please do not use the Services.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Eligibility</Text>
          <Text style={{ marginBottom: 4 }}>
            You must be at least 18 years old to use the platform. If you are under the age of 18, you must have your parent or guardian’s permission.
            By using the Services, you represent that:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You are eligible to use the platform;</Text>
            <Text>• The information you provide is accurate and truthful;</Text>
            <Text>• You will comply with these Terms and all applicable laws.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>User Accounts</Text>
          <Text style={{ marginBottom: 4 }}>
            To access certain features, you may be required to create an account. You are responsible for:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Maintaining the confidentiality of your login credentials;</Text>
            <Text>• All activity that occurs under your account;</Text>
            <Text>• Updating your information to keep it accurate.</Text>
          </View>
          <Text style={{ marginBottom: 8 }}>
            We reserve the right to suspend or terminate accounts that violate these Terms or appear to be fraudulent.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Permitted Use</Text>
          <Text style={{ marginBottom: 4 }}>
            You agree to use the platform only for lawful purposes, including:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Connecting with friends and making new social connections;</Text>
            <Text>• Participating in non-casino online games for entertainment;</Text>
            <Text>• Sharing content that complies with our community guidelines.</Text>
          </View>
          <Text style={{ marginBottom: 4 }}>You may not:</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Harass, bully, impersonate, or threaten others;</Text>
            <Text>• Post harmful, illegal, obscene, or violent content;</Text>
            <Text>• Attempt to hack, exploit, or disrupt the platform or its services;</Text>
            <Text>• Use bots, scripts, or automated systems to manipulate gameplay or social features.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Content Ownership and Use</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You retain ownership of the content you post but grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, display, and distribute your content for the purpose of operating the platform.</Text>
            <Text>• You are responsible for the content you share. Do not post anything you do not have the right to use or distribute.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Gaming Features</Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• All games are for entertainment purposes only. There are no gambling, betting, or monetary rewards involved.</Text>
            <Text>• In-game purchases (if any) are non-refundable and do not carry real-world monetary value.</Text>
          </View>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Privacy</Text>
          <Text style={{ marginBottom: 8 }}>
            Your use of the platform is subject to our Privacy Policy, which outlines how we collect, use, and protect your personal information. By using our Services, you consent to the collection and use of your data in accordance with our Privacy Policy.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Termination</Text>
          <Text style={{ marginBottom: 4 }}>
            We may suspend or terminate your access to the platform without prior notice if:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• You violate these Terms or community standards;</Text>
            <Text>• We are required to do so by law;</Text>
            <Text>• We detect fraudulent or abusive behavior.</Text>
          </View>
          <Text style={{ marginBottom: 8 }}>
            You may delete your account at any time by contacting support or using the platform settings.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Limitation of Liability</Text>
          <Text style={{ marginBottom: 4 }}>
            We provide the Services “as-is” and make no warranties regarding:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Platform availability or error-free functionality;</Text>
            <Text>• User behavior or posted content;</Text>
            <Text>• Compatibility with your device or browser.</Text>
          </View>
          <Text style={{ marginBottom: 8 }}>
            To the maximum extent permitted by law, we are not liable for any damages (including loss of data, revenue, or reputation) arising from your use of the platform.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Changes to Terms</Text>
          <Text style={{ marginBottom: 8 }}>
            We reserve the right to update these Terms at any time. Changes will be posted on this page, and your continued use of the platform signifies your acceptance of the updated Terms.
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Governing Law</Text>
          <Text style={{ marginBottom: 8 }}>
            These Terms are governed by the laws of [Insert Jurisdiction/Country], without regard to conflict of law principles. Any disputes shall be resolved in the courts of [Insert Jurisdiction].
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 12 }}>Contact Us</Text>
          <Text style={{ marginBottom: 4 }}>
            If you have any questions or concerns about these Terms, please contact us at:
          </Text>
          <View style={{ marginLeft: 16, marginBottom: 8 }}>
            <Text>• Platform Name : Friends Club</Text>
            <Text>• Email: [customercare@clientfriendcluubs.com]</Text>
            <Text>• Address: [Holding No :- 372, WEST TOWER, 11 W 2 ROOM NO. 22, ACTION AREA 1, IIF, NEW TOWN, CHAKPACHURIA , District :- North 24 Parganas, Pincode :- 700156 in ward no. 11]</Text>
            <Text>• Phone Contact Details: +918240210845</Text>
          </View>
        </Accordion>
        <Accordion title="Community Guidelines">
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
            We've built this platform to help people connect, share, and have fun in a safe and respectful environment. To keep our community positive for everyone, please follow these simple guidelines:
          </Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>1. Respect Others</Text>
          <Text style={{ marginBottom: 8 }}>Treat every member with kindness and respect. Harassment, hate speech, bullying, or discrimination of any kind will not be tolerated.</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>2. Keep It Clean</Text>
          <Text style={{ marginBottom: 8 }}>Avoid posting or sharing explicit, violent, or otherwise inappropriate content. Let's keep Friends Club enjoyable for all users.</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>3. Be Authentic</Text>
          <Text style={{ marginBottom: 8 }}>Use your real identity and honest information. Fake profiles, impersonation, or misleading activity aren't allowed.</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>4. Protect Privacy</Text>
          <Text style={{ marginBottom: 8 }}>Don't share anyone's personal information — including your own — publicly. Respect the privacy and safety of others.</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>5. No Spam or Scams</Text>
          <Text style={{ marginBottom: 8 }}>Avoid spam, promotional links, or any activity meant to mislead or defraud others.</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>6. Report and Support</Text>
          <Text style={{ marginBottom: 8 }}>If you see something harmful or suspicious, report it. Our team reviews reports carefully to keep the community safe.</Text>
        </Accordion>
        <Accordion title="Compliance Statement">
          <Text style={{ color: '#888' }}>We comply with all local regulations and standards.</Text>
        </Accordion>
        <Accordion title="Content Moderation Policy">
          <Text style={{ color: '#888' }}>All content is reviewed to ensure it meets community standards.</Text>
        </Accordion>
      </ScrollView>
      <CopyrightFooter />
    </SafeAreaView>
  );
};

export default TermsAndConditions;
