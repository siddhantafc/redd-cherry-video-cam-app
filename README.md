# Redd Cherry Live Video Cam — Android Flavors (Host/User)

This app ships two Android APKs via Gradle product flavors:
- Host: `com.reddcherry.host`
- User: `com.reddcherry.user`

Each APK shows only the relevant signup page (no toggle). Fast Refresh works with Metro while developing.

## Prerequisites
- Node.js and npm
- Android SDK + a connected device or emulator
- Java JDK 17+

## Install dependencies
```zsh
npm install
```

## Start the Metro dev server
```zsh
npm start
```

## Live development (install a debug APK)
Install the flavor you’re working on, then edit JS and use Fast Refresh.

- Host debug install
```zsh
npm run android:apk:host:debug
```

- User debug install
```zsh
npm run android:apk:user:debug
```

If the app can’t reach Metro:
```zsh
adb reverse tcp:8081 tcp:8081
```
Open the Developer Menu (shake or `adb shell input keyevent 82`) and ensure Fast Refresh is enabled.

## Release builds (APK)
These commands create installable release APKs for each flavor.

- Build Host release APK
```zsh
npm run android:apk:host:release:build
```

- Build User release APK
```zsh
npm run android:apk:user:release:build
```

Optional install to a connected device:
```zsh
npm run android:apk:host:release:install
npm run android:apk:user:release:install
```

APK output paths (typical Gradle layout):
- `android/app/build/outputs/apk/host/debug/app-host-debug.apk`
- `android/app/build/outputs/apk/host/release/app-host-release.apk`
- `android/app/build/outputs/apk/user/debug/app-user-debug.apk`
- `android/app/build/outputs/apk/user/release/app-user-release.apk`

## Icons per flavor (optional)
Generate flavor-specific launcher icons from `app/assets/images/icon-fc-512.webp`.

```zsh
npm run icons:android:host   # writes icons under android/app/src/host/res
npm run icons:android:user   # writes icons under android/app/src/user/res
```

## iOS & Web
This repo uses Expo for bundling. iOS and Web don’t use Android flavors; signup defaults to the User flow.

## Troubleshooting
- Missing debug keystore: generate one at `android/app/debug.keystore`:
	```zsh
	cd android/app
	keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
	```
- Clean Android build cache:
	```zsh
	cd android
	./gradlew clean
	```

