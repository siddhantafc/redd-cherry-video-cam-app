import React from 'react';
import useVideoCall from '../hooks/useVideoCall';
import { VideoCallContext } from '../hooks/useVideoCallContext';

const VideoCallProvider = ({ children }) => {
  const videoCallState = useVideoCall();

  return (
    <VideoCallContext.Provider value={videoCallState}>
      {children}
    </VideoCallContext.Provider>
  );
};

export default VideoCallProvider;
