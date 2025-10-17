import React from 'react';
import { useSecureScreen } from '../hooks/useSecureScreen';

const AuthenticatedScreenWrapper = ({ children }) => {
  // Enforce secure screen (attempt to block screenshots / recording where supported)
  useSecureScreen();
  // Provider has been moved to App root to avoid duplicate listeners/modals
  return children;
};

export default AuthenticatedScreenWrapper;
