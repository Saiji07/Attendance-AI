import React, { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import SignInPage from './SignInPage';
import { authAPI } from '../../lib/api';

export default function AuthGuard({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Sync user with backend when authenticated
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user) {
        try {
          await authAPI.syncUser(user);
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
    };

    syncUser();
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInPage />;
  }

  return <>{children}</>;
}