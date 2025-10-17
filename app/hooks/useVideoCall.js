import { useEffect, useRef, useState, useCallback } from 'react';
import { acquireSocket, releaseSocket } from '../lib/socket';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from 'react-native-agora';
import { API_BASE_URL, AGORA_APP_ID } from '@env';
import { AuthStorage } from '../utils/authStorage';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { useWalletBalance } from '../contexts/WalletBalanceContext';
import { useAuth } from '../contexts/AuthContext';

export const useVideoCall = () => {
  const { token: authToken, isAuthenticated } = useAuth();
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected, ended
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUid, setRemoteUid] = useState(null);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);
  
  const socketRef = useRef(null);
  const engineRef = useRef(null);
  const [engineReady, setEngineReady] = useState(false);
  const callTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStateRef = useRef(callState);
  const activeCallIdRef = useRef(null);
  const hasEndedRef = useRef(false);
  const { balanceSeconds, isUserRole, refreshBalance } = useWalletBalance();
  const lastIncomingIdRef = useRef(null);
  
  // Update callState ref when state changes
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Initialize Socket.IO listeners using a shared singleton, after auth
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // Only connect when authenticated and we have a token
        const token = authToken || (await AuthStorage.getToken());
        if (!token || !isAuthenticated) {
          // If not authenticated, release our ref; other providers may still hold the socket
          releaseSocket();
          return;
        }

        const socket = await acquireSocket();
        if (!mounted || !socket) return;
        socketRef.current = socket;

        const onConnect = () => console.log('Video call socket connected');
        const onIncoming = (data) => {
          // Ignore duplicates of the same callId, or new incoming while already ringing/connected
          if (!data?.callId) {
            console.warn('Incoming call missing callId; ignoring');
            return;
          }
          if (lastIncomingIdRef.current === data.callId) {
            console.log('Duplicate incoming call event ignored for callId:', data.callId);
            return;
          }
          if (callStateRef.current === 'ringing' || callStateRef.current === 'connected' || callStateRef.current === 'calling') {
            console.log('Incoming call ignored because state is', callStateRef.current);
            return;
          }
          lastIncomingIdRef.current = data.callId;
          console.log('Incoming call:', data);
          setIncomingCall(data);
          setCallState('ringing');
        };
    const onAccepted = (data) => {
          console.log('Call accepted:', data);
          if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
          console.log('Call accepted by receiver - caller already in channel');
        };
  const onRejected = (data) => { console.log('Call rejected:', data); lastIncomingIdRef.current = null; handleCallEnd(); };
  const onEnded = (data) => { console.log('Call ended:', data); lastIncomingIdRef.current = null; handleCallEnd(); };
  const onEndedAuto = (data) => { console.log('Call ended (auto):', data); lastIncomingIdRef.current = null; handleCallEnd(); };
  const onFailed = (data) => { console.log('Call failed:', data); lastIncomingIdRef.current = null; handleCallEnd(); };
        const onConnectError = (error) => { console.error('Socket connection error:', error); };

        socket.on('connect', onConnect);
        socket.on('call:incoming', onIncoming);
        socket.on('call:accepted', onAccepted);
        socket.on('call:rejected', onRejected);
        socket.on('call:ended', onEnded);
  socket.on('call:failed', onFailed);
  socket.on('call:ended:auto', onEndedAuto);
        socket.on('connect_error', onConnectError);

        return () => {
          socket.off('connect', onConnect);
          socket.off('call:incoming', onIncoming);
          socket.off('call:accepted', onAccepted);
          socket.off('call:rejected', onRejected);
          socket.off('call:ended', onEnded);
          socket.off('call:failed', onFailed);
          socket.off('call:ended:auto', onEndedAuto);
          socket.off('connect_error', onConnectError);
        };
      } catch (e) {
        console.error('Error initializing socket:', e);
      }
    };
    const cleanup = init();

    return () => {
      mounted = false;
      if (typeof cleanup === 'function') cleanup();
      releaseSocket();
    };
  }, [authToken, isAuthenticated]);

  // Ask Android runtime permissions for camera/mic
  const requestAndroidPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cameraGranted = result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const micGranted = result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

      if (!cameraGranted || !micGranted) {
        console.warn('Camera/Microphone permission not granted');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Failed to request permissions', e);
      return false;
    }
  }, []);

  // Start call timer (idempotent)
  const startCallTimer = () => {
    if (callTimerRef.current) return; // prevent multiple timers
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // Stop call timer
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  // Initialize Agora RTC Engine
  useEffect(() => {
    const initializeAgora = async () => {
      try {
        if (!AGORA_APP_ID) {
          console.error('❌ AGORA_APP_ID is not configured');
          return;
        }

        // On Android ensure runtime permissions are granted before enabling local media
        const permsOk = await requestAndroidPermissions();
        if (Platform.OS === 'android' && !permsOk) {
          console.error('❌ Missing Android camera/mic permissions');
          return;
        }
        
        // Validate App ID format
        const cleanAppId = AGORA_APP_ID.trim();
        if (cleanAppId.length !== 32) {
          console.error('❌ AGORA_APP_ID has invalid length:', cleanAppId.length, 'expected: 32');
          return;
        }
        
        if (!/^[a-f0-9]{32}$/i.test(cleanAppId)) {
          console.error('❌ AGORA_APP_ID has invalid format. Must be 32 hex characters');
          return;
        }
        
        console.log('🔧 AGORA: Initializing with App ID:', cleanAppId);
        console.log('🔧 AGORA: App ID length:', cleanAppId.length);
        console.log('🔧 AGORA: App ID type:', typeof cleanAppId);
        console.log('🔧 AGORA: App ID format validation: ✅');
        
  engineRef.current = createAgoraRtcEngine();
        const engine = engineRef.current;

        // Initialize the engine with proper configuration for v4.5.3
        const initResult = await engine.initialize({
          appId: cleanAppId, // Use validated clean App ID
          // Use Communication for direct video calls between users
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
        
  console.log('🔧 AGORA: Initialize result:', initResult);
  setEngineReady(true);

        // Enable video module
        console.log('📹 AGORA: Enabling video and audio...');
        await engine.enableVideo();
        await engine.enableAudio();
        await engine.enableLocalVideo(true);
        await engine.enableLocalAudio(true);
        try {
          await engine.setClientRole?.(ClientRoleType.ClientRoleBroadcaster);
        } catch {}
        try {
          await engine.setEnableSpeakerphone?.(true);
        } catch {}
        // Start local preview to turn on camera immediately
        try {
          await engine.startPreview();
          console.log('📹 AGORA: Local preview started');
        } catch (e) {
          console.warn('⚠️ AGORA: Failed to start preview (may start after join):', e?.message || e);
        }

        // Set up event handlers
        engine.addListener('onJoinChannelSuccess', (connection, elapsed) => {
          console.log('🎉 AGORA: Joined channel:', connection.channelId, 'elapsed:', elapsed);
          // Keep state as "calling" until remote joins/accepts
          // setCallState('connected'); // removed
          // startCallTimer(); // removed
        });

        engine.addListener('onUserJoined', (connection, uid, elapsed) => {
          console.log('👥 AGORA: Remote user joined with UID:', uid, 'elapsed:', elapsed);
          setRemoteUid(uid);
          setRemoteVideoReady(false);
          setCallState('connected');
          startCallTimer();
        });

        // Diagnose remote video state changes that can lead to black screen
        engine.addListener('onRemoteVideoStateChanged', (connection, uid, state, reason, elapsed) => {
          console.log('🎥 AGORA: Remote video state changed:', { uid, state, reason, elapsed });
          // Agora RN v4 states: 0 Stopped, 1 Starting, 2 Decoding, 3 Frozen, 4 Failed
          if (uid && state === 2) {
            setRemoteVideoReady(true);
          } else if (uid && (state === 0 || state === 4)) {
            setRemoteVideoReady(false);
          }
          if (uid && (state === 2 || state === 3)) {
            try {
              // Ensure we are subscribed (v4 autoSubscribe should handle, this is just defensive)
              engine?.muteRemoteVideoStream?.(uid, false);
            } catch {}
          }
        });

        engine.addListener('onUserOffline', (connection, uid, reason) => {
          console.log('👋 AGORA: Remote user left with UID:', uid, 'reason:', reason);
          console.log('Current call state:', callStateRef.current);
          setRemoteUid(null);
          setRemoteVideoReady(false);
          if (callStateRef.current === 'connected' || callStateRef.current === 'calling') {
            if (!hasEndedRef.current) {
              console.log('Ending call due to user offline');
              // Use the public endCall which also notifies backend and emits socket event
              endCall();
            }
          }
        });

        engine.addListener('onLeaveChannel', (connection, stats) => {
          console.log('🚪 AGORA: Left channel');
          setCallState('ended');
          stopCallTimer();
        });

        engine.addListener('onError', (err, msg) => {
          console.error('❌ AGORA: Error:', err, msg);
        });

        engine.addListener('onConnectionStateChanged', (connection, state, reason) => {
          console.log('🔗 AGORA: Connection state changed:', state, 'reason:', reason);
        });

        engine.addListener('onTokenPrivilegeWillExpire', (connection, token) => {
          console.log('⏰ AGORA: Token will expire:', token);
        });

      } catch (error) {
        console.error('Error initializing Agora:', error);
      }
    };

    initializeAgora();

    return () => {
      if (engineRef.current) {
        engineRef.current.stopPreview?.();
        engineRef.current.leaveChannel();
        try { engineRef.current.removeAllListeners?.(); } catch {}
        engineRef.current.release();
      }
      setEngineReady(false);
    };
  }, []);

  // Join Agora channel
  const joinAgoraChannel = async (channelName, token) => {
    try {
      // Wait for engine to be initialized if a join is requested too early
      let waitMs = 0;
      while (!engineRef.current && waitMs < 3000) {
        await new Promise(r => setTimeout(r, 100));
        waitMs += 100;
      }
      // Ensure permissions right before join (important when user triggers join quickly)
      const permsOk = await requestAndroidPermissions();
      if (Platform.OS === 'android' && !permsOk) {
        throw new Error('Android camera/mic permissions denied');
      }

      if (!engineRef.current) {
        throw new Error('Agora engine not initialized');
      }

      // Enforce 64 char limit to match Agora constraints
      const MAX_LEN = 64;
      let finalChannelName = channelName;
      if (finalChannelName.length > MAX_LEN) {
        const hash = (str) => {
          let h = 0;
            for (let i = 0; i < str.length; i++) {
              h = (h << 5) - h + str.charCodeAt(i);
              h |= 0;
            }
          return Math.abs(h).toString(36);
        };
        const parts = channelName.split('_');
        // Expecting call_originalCaller_originalReceiver_timestamp
        if (parts.length >= 4) {
          const h1 = hash(parts[1]);
          const h2 = hash(parts[2]);
          const ts = parts[parts.length - 1];
          finalChannelName = `call_${h1}_${h2}_${ts}`;
          if (finalChannelName.length > MAX_LEN) {
            finalChannelName = `call_${h1}_${h2}_${ts.slice(-6)}`;
          }
          console.log('⚠️ AGORA: Channel name shortened locally:', finalChannelName, 'length:', finalChannelName.length);
        }
      }

      const userInfo = await AuthStorage.getUser();
      
      // Convert string user ID to numeric UID using same hash as backend
      let hash = 0;
      for (let i = 0; i < userInfo.id.length; i++) {
        const char = userInfo.id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to signed 32-bit integer
      }
      const uid = Math.abs(hash) % 2147483647;

      console.log('🚀 AGORA: Joining channel:', finalChannelName, 'with UID:', uid);
      console.log('🎫 AGORA: Token provided:', !!token, 'Length:', token?.length);
      console.log('🆔 AGORA: Using App ID:', AGORA_APP_ID?.trim());
      console.log('🆔 AGORA: App ID length check:', AGORA_APP_ID?.trim()?.length === 32);
      
      if (!token) {
        console.error('❌ AGORA: No token provided! This will cause join to fail.');
        throw new Error('No Agora token provided');
      }

      // Log the exact parameters being used
      console.log('📋 AGORA: Join parameters:');
      console.log('  - Channel:', finalChannelName);
      console.log('  - UID:', uid);
      console.log('  - Token preview:', token.substring(0, 50) + '...');
      console.log('  - User ID (original):', userInfo.id);

      // Try joining with a fallback UID if the calculated one is 0
      const finalUid = uid === 0 ? Math.floor(Math.random() * 1000000) + 1000 : uid;
      console.log('🔧 AGORA: Final UID to use:', finalUid);

      const result = await engineRef.current.joinChannel(token, finalChannelName, finalUid, {
        publishMicrophone: true,
        publishCamera: true,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      try {
        await engineRef.current.setClientRole?.(ClientRoleType.ClientRoleBroadcaster);
        await engineRef.current.setEnableSpeakerphone?.(true);
      } catch {}

      console.log('✅ AGORA: Join channel result:', result, '(type:', typeof result, ')');
      
      // More comprehensive error checking
      if (result !== 0 && result !== undefined) {
        const errorMessages = {
          [-102]: 'ERR_INVALID_APP_ID - Check your App ID and Certificate',
          [-109]: 'ERR_TOKEN_EXPIRED - Token has expired',
          [-110]: 'ERR_INVALID_TOKEN - Invalid token',
          [-113]: 'ERR_NOT_INITIALIZED - Agora engine not initialized',
          [-119]: 'ERR_INVALID_USER_ID - Invalid user ID',
          ['-102']: 'ERR_INVALID_APP_ID - Check your App ID and Certificate',
          ['-109']: 'ERR_TOKEN_EXPIRED - Token has expired',
          ['-110']: 'ERR_INVALID_TOKEN - Invalid token',
          ['-113']: 'ERR_NOT_INITIALIZED - Agora engine not initialized',
          ['-119']: 'ERR_INVALID_USER_ID - Invalid user ID'
        };
        
        const errorMsg = errorMessages[result] || errorMessages[result.toString()] || `Unknown error: ${result}`;
        console.error('❌ AGORA: Join failed with error:', errorMsg);
        console.error('❌ AGORA: Raw result:', result);
        
        // Special handling for -102 error
        if (result === -102 || result === '-102') {
          console.error('🔍 AGORA ERR_INVALID_APP_ID Debug Info:');
          console.error('  - App ID used:', AGORA_APP_ID?.trim());
          console.error('  - App ID length:', AGORA_APP_ID?.trim()?.length);
          console.error('  - Token length:', token?.length);
          console.error('  - Channel name:', channelName);
          console.error('  - UID:', finalUid);
          console.error('💡 Possible solutions:');
          console.error('  1. Verify App ID in .env file matches Agora Console');
          console.error('  2. Check if App Certificate is enabled in Agora Console');
          console.error('  3. Ensure project is active and not suspended');
          console.error('  4. Try recreating the Agora project');
        }
        
        throw new Error(errorMsg);
      }
      
      console.log('Successfully joined Agora channel:', finalChannelName, 'with UID:', uid);
    } catch (error) {
      console.error('Error joining Agora channel:', error);
      console.error('Channel:', channelName, 'Token length:', token?.length);
      
      // Don't immediately end the call on join error - let the user try again
      // handleCallEnd();
      
      // Instead, set an error state or show a retry option
      setCallState('idle');
    }
  };

  // Initiate a call
  const initiateCall = useCallback(async (receiverId, callType = 'video') => {
    try {
      // Guard: role-2 users cannot initiate a call with zero balance
      if (isUserRole && Number(balanceSeconds) <= 0) {
        console.warn('Insufficient balance to initiate call');
        try { Alert.alert('Insufficient Balance', 'You need to recharge to start a call.'); } catch {}
        return;
      }

      const token = await AuthStorage.getToken();
      const userInfo = await AuthStorage.getUser();

  setCallState('calling');
  hasEndedRef.current = false;

      // Set a tentative call object so UI gets channel/name once API responds
      // We'll update it with full data below
      setCurrentCall((prev) => prev || { id: null, receiverId, callType });

      const response = await fetch(`${API_BASE_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId,
          callType,
        }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to initiate call';
        try {
          const errData = await response.json();
          errMsg = errData?.error || errData?.message || errMsg;
        } catch {}
        console.error('Initiate call failed. Status:', response.status, 'Message:', errMsg);
        throw new Error(errMsg);
      }

  const data = await response.json();
  setCurrentCall(data.call);
  activeCallIdRef.current = data.call?.id || data.call?.callId || null;

      // Send call invitation via socket
      if (socketRef.current) {
        socketRef.current.emit('call:initiate', {
          callId: data.call.id,
          receiverId,
          channelName: data.call.channelName,
          callType,
          callerInfo: {
            id: userInfo.id,
            name: userInfo.name,
            username: userInfo.username,
            // include avatar if available
            profilePictureUrl: userInfo.profilePictureUrl,
          },
        });
      }

      // Caller-side timeout after 45 seconds
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        console.log('Caller timeout (45s)');
        endCallDueToTimeout();
      }, 45000);

      // Join Agora channel immediately for caller
      await joinAgoraChannel(data.call.channelName, data.tokens.callerToken);

    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState('idle');
    }
  }, []);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    try {
      if (!incomingCall) return;
      // Clear any ringing timeout when accepting
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      const token = await AuthStorage.getToken();
      const userInfo = await AuthStorage.getUser();

      // Ensure UI has channel info immediately to avoid black screen until join completes
      // Setting this before join helps downstream components derive `connection`
  setCurrentCall(incomingCall);
  activeCallIdRef.current = incomingCall.callId || incomingCall.id || null;
  hasEndedRef.current = false;

      // Accept call via API
      const response = await fetch(`${API_BASE_URL}/api/calls/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callId: incomingCall.callId,
          // Send channelName so backend could optionally generate a token in future
          channelName: incomingCall.channelName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept call');
      }

      await response.json(); // currently not used (no token returned by backend)

      // Fetch Agora token explicitly (backend /token route validates user)
      const tokenResp = await fetch(`${API_BASE_URL}/api/calls/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelName: incomingCall.channelName,
          userId: userInfo.id,
          role: 'publisher'
        })
      });

      if (!tokenResp.ok) {
        console.error('❌ Failed to fetch Agora token for accept. Status:', tokenResp.status);
        throw new Error('Failed to fetch Agora token');
      }

      const tokenData = await tokenResp.json();
      const rtcToken = tokenData.token;
      if (!rtcToken) {
        console.error('❌ No token field in /api/calls/token response:', tokenData);
        throw new Error('Token missing in response');
      }

      // Notify caller via socket
      if (socketRef.current) {
        socketRef.current.emit('call:accept', {
          callId: incomingCall.callId,
          callerId: incomingCall.caller.id,
        });
      }

      // Set call state to calling (transitioning to connected)
      setCallState('calling');
      
      // Join Agora channel
      await joinAgoraChannel(incomingCall.channelName, rtcToken);
      setIncomingCall(null);

    } catch (error) {
      console.error('Error accepting call:', error);
      rejectCall();
    }
  }, [incomingCall]);

  // Reject incoming call
  const rejectCall = useCallback(async () => {
    try {
      if (!incomingCall) return;
      // Clear any ringing timeout when rejecting
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }

      const token = await AuthStorage.getToken();

      // Reject call via API
      await fetch(`${API_BASE_URL}/api/calls/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callId: incomingCall.callId,
        }),
      });

      // Notify caller via socket
      if (socketRef.current) {
        socketRef.current.emit('call:reject', {
          callId: incomingCall.callId,
          callerId: incomingCall.caller.id,
        });
      }

      setIncomingCall(null);
      setCallState('idle');
      lastIncomingIdRef.current = null;

    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [incomingCall]);

  // Receiver-side timeout: auto dismiss incoming screen after 44 seconds
  useEffect(() => {
    if (callState === 'ringing' && incomingCall) {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        console.log('Incoming call timeout (44s)');
        endCallDueToTimeout();
      }, 44000);
      return () => {
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
      };
    }
  }, [callState, incomingCall, endCallDueToTimeout]);

  // End current call
  const endCall = useCallback(async () => {
    try {
      if (hasEndedRef.current) {
        console.log('endCall already processed; skipping');
        return;
      }
      const callToEnd = currentCall || incomingCall;
      if (!callToEnd) {
        // If we don't have call metadata yet (race during early "calling" state),
        // still perform local cleanup so the user can exit the screen.
        console.warn('endCall called without an active call object; performing local cleanup');
        handleCallEnd();
        return;
      }

      const token = await AuthStorage.getToken();

      // End call via API
      await fetch(`${API_BASE_URL}/api/calls/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callId: callToEnd.callId || callToEnd.id,
        }),
      });

      // Notify other party via socket
      if (socketRef.current) {
        // Determine the other user's ID
        const otherUserId = callToEnd.caller 
          ? callToEnd.caller.id 
          : callToEnd.receiver?.id || callToEnd.receiverId;
          
        socketRef.current.emit('call:end', {
          callId: callToEnd.callId || callToEnd.id,
          otherUserId: otherUserId,
        });
      }

      hasEndedRef.current = true;
      handleCallEnd();

    } catch (error) {
      console.error('Error ending call:', error);
      hasEndedRef.current = true;
      handleCallEnd();
    }
  }, [currentCall, incomingCall]);

  // Auto-end call when wallet balance reaches 0 for role-2 users
  useEffect(() => {
    if (!isUserRole) return;
    if ((callState === 'connected' || callState === 'calling') && Number(balanceSeconds) <= 0) {
      console.log('Auto-ending call due to zero wallet balance');
      endCall();
    }
  }, [balanceSeconds, callState, isUserRole, endCall]);

  // End call due to timeout before acceptance
  const endCallDueToTimeout = useCallback(async () => {
    try {
      if (hasEndedRef.current) return;
      const callToEnd = currentCall || incomingCall;
      if (!callToEnd) {
        handleCallEnd();
        return;
      }

      const token = await AuthStorage.getToken();
      await fetch(`${API_BASE_URL}/api/calls/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          callId: callToEnd.callId || callToEnd.id,
          reason: 'timeout',
        }),
      });

      if (socketRef.current) {
        const otherUserId = callToEnd.caller 
          ? callToEnd.caller.id 
          : callToEnd.receiver?.id || callToEnd.receiverId;
        socketRef.current.emit('call:end', {
          callId: callToEnd.callId || callToEnd.id,
          otherUserId,
        });
      }
    } catch (e) {
      console.error('Error ending call due to timeout:', e);
    } finally {
      hasEndedRef.current = true;
      handleCallEnd();
    }
  }, [currentCall, incomingCall]);

  // Handle call end cleanup
  const handleCallEnd = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    stopCallTimer();

    if (engineRef.current) {
      try { engineRef.current.stopPreview?.(); } catch {}
      engineRef.current.leaveChannel();
    }

    setCallState('idle');
    setCurrentCall(null);
    setIncomingCall(null);
    setRemoteUid(null);
    setRemoteVideoReady(false);
    setCallDuration(0);
    activeCallIdRef.current = null;
    hasEndedRef.current = false;
    lastIncomingIdRef.current = null;

    // Proactively refresh wallet balance once after cleanup to reflect last debits
    // (socket updates should keep it current during the call, this is a safety net)
    try { refreshBalance?.(); } catch {}
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (engineRef.current) {
      const newState = !isAudioEnabled;
      engineRef.current.enableLocalAudio(newState);
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (engineRef.current) {
      const newState = !isVideoEnabled;
      engineRef.current.enableLocalVideo(newState);
      if (newState) {
        // Restart preview when enabling video
        engineRef.current.startPreview?.();
      } else {
        engineRef.current.stopPreview?.();
      }
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    if (engineRef.current) {
      const newState = !isSpeakerEnabled;
      engineRef.current.setEnableSpeakerphone(newState);
      setIsSpeakerEnabled(newState);
    }
  }, [isSpeakerEnabled]);

  // Switch camera
  const switchCamera = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.switchCamera();
    }
  }, []);

  // Format call duration
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // State
    callState,
    currentCall,
    incomingCall,
    isAudioEnabled,
    isVideoEnabled,
    isSpeakerEnabled,
    callDurationFormatted: formatCallDuration(callDuration),
    remoteUid,
  remoteVideoReady,
    engine: engineRef.current,
    engineReady,

    // Actions
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
  };
};

export default useVideoCall;
