### Start Frontend Application

```bash
# Terminal 3: Start React Native Metro Bundler
cd application
npx expo start --dev-client
```

### Build and Run on Device

#### For Development Build:

```bash
# Build for Android (first time)
npx expo prebuild

# Run on Android device/emulator
npx expo run:android

# Run on iOS device/simulator (macOS only)
npx expo run:ios
```

## Testing Video Calls

### Two-Device Testing Setup

1. **Physical Device + Emulator**:
   - Start Android emulator in Android Studio
   - **First installation**: Run `npx expo run:android` and select your physical device from the list
   - **Second installation**: Run `npx expo run:android` again and select the emulator from the list
   - Both devices will now have the same build version


### Test Users

Default seeded users (if using seed data):
- **Host**: `host1@gmail.com` / password: `Password`
- **Client**: `client1@gmail.com` / password: `Password`

### Testing Flow

1. **Start Metro**: `npx expo start --dev-client`
2. **Open app on both devices** (manually from app drawer)
3. **Login with different users** on each device
4. **Ensure both users show as online**
5. **Tap video/audio call buttons** in user cards
6. **Accept incoming calls** to test the full flow

## Troubleshooting

### Common Issues

1. **"NativeModule" undefined or "main" not registered errors**:
   ```bash
   # Stop Metro (Ctrl+C) and clean cache
   npx expo start --dev-client --clear
   # Or try clearing all caches
   npm start -- --reset-cache
   ```

2. **App crashes on emulator but works on physical device**:
   - Ensure emulator has sufficient RAM (4GB+)
   - Try cold boot: Android Studio > AVD Manager > Actions > Cold Boot Now
   - Restart Metro bundler: `npx expo start --dev-client --clear`

3. **Connection issues between devices**:
   - Ensure both devices are on the same network
   - Check backend is running and accessible
   - Verify API_BASE_URL in `.env` file points to correct IP address