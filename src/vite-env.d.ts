/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface ClerkSession {
  getToken: () => Promise<string>;
}

interface ClerkGlobal {
  session?: ClerkSession;
}

interface Window {
  Clerk?: ClerkGlobal;
}
