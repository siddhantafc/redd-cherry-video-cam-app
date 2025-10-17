# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# --- Added for Razorpay SDK (references proguard annotations) ---
-keep class com.razorpay.** { *; }
-keep interface com.razorpay.** { *; }
# Razorpay sometimes uses annotations under proguard.annotation.*
-dontwarn proguard.annotation.**
-keep class proguard.annotation.** { *; }

# --- Agora SDK keep rules (avoid stripping media & internal reflection) ---
-keep class io.agora.** { *; }
-dontwarn io.agora.**

# Prevent removal of logging helper used via reflection
-keep class **.Logging { *; }

# Keep desugar runtime ThrowableExtension if referenced indirectly
-dontwarn com.google.devtools.build.android.desugar.runtime.**

# General annotation + reflection safety for libraries
-keepattributes *Annotation*

# Sometimes R8 is too aggressive with enum methods used via reflection
-keepclassmembers enum * { **[] $VALUES; public *; }

# Retain React Native Hermes/JSC bridging classes
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep any Expo generated modules
-keep class expo.modules.** { *; }

# Avoid warnings about missing META-INF entries
-dontwarn javax.annotation.**
-dontwarn kotlin.**

# Google Pay / Play Services Wallet
-keep class com.google.android.gms.wallet.** { *; }
-keep class com.google.android.apps.nbu.paisa.inapp.client.api.** { *; }
-dontwarn com.google.android.apps.nbu.paisa.inapp.client.api.**

