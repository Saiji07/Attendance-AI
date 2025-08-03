import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

export { ClerkProvider, useAuth, useUser };
export { clerkPubKey };