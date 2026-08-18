import React from 'react';
import { AuthScreen } from './AuthScreen';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { userRole } = useApp();
  return <AuthScreen initialMode="login" role={userRole} />;
}
