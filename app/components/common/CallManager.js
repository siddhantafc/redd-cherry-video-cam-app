import React from 'react';
import { Modal } from 'react-native';
import { useVideoCallContext } from '../../hooks/useVideoCallContext';
import VideoCallScreen from '../../screens/calls/VideoCallScreen';
import IncomingCallScreen from '../../screens/calls/IncomingCallScreen';

const CallManager = () => {
  const {
    callState,
    currentCall,
    incomingCall,
    isAudioEnabled,
    isVideoEnabled,
    isSpeakerEnabled,
    callDurationFormatted,
    remoteUid,
    engine,
    engineReady,
  remoteVideoReady,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleSpeaker,
    switchCamera,
  } = useVideoCallContext();

  // Show incoming call screen
  if (callState === 'ringing' && incomingCall) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <IncomingCallScreen
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      </Modal>
    );
  }

  // Show video call screen when connected or calling
  if (callState === 'connected' || callState === 'calling') {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <VideoCallScreen
          currentCall={currentCall}
          remoteUid={remoteUid}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isSpeakerEnabled={isSpeakerEnabled}
          callDurationFormatted={callDurationFormatted}
          onEndCall={endCall}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleSpeaker={toggleSpeaker}
          onSwitchCamera={switchCamera}
          engine={engine}
          engineReady={engineReady}
          remoteVideoReady={remoteVideoReady}
        />
      </Modal>
    );
  }

  return null;
};

export default CallManager;
