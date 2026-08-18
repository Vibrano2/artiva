import React from 'react';
import { AuthScreen } from './AuthScreen';
import { useApp } from '../context/AppContext';

export function SignUpPage() {
  const { userRole } = useApp();
  return <AuthScreen initialMode="signup" role={userRole} />;
}
