import { useContext, createContext } from 'react';

// Create Video Call Context
export const VideoCallContext = createContext(null);

// Hook to use video call context
export const useVideoCallContext = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    // Return a mock context with safe defaults when provider is not available
    console.warn('useVideoCallContext used outside of VideoCallProvider, returning mock functions');
    return {
      callState: 'idle',
      currentCall: null,
      incomingCall: null,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isSpeakerEnabled: true,
      callDurationFormatted: '00:00',
      remoteUid: null,
      engine: null,
    engineReady: false,
      initiateCall: () => console.warn('Video call not available'),
      acceptCall: () => console.warn('Video call not available'),
      rejectCall: () => console.warn('Video call not available'),
      endCall: () => console.warn('Video call not available'),
      toggleAudio: () => console.warn('Video call not available'),
      toggleVideo: () => console.warn('Video call not available'),
      toggleSpeaker: () => console.warn('Video call not available'),
      switchCamera: () => console.warn('Video call not available'),
    };
  }
  return context;
};

export default useVideoCallContext;
