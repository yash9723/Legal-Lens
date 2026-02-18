
// Mock Firebase implementation to fix SDK errors
// This allows the application to run without the external firebase package

export const app = {}; 

// --- Auth Types & Mocks ---

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

class MockAuth {
  currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    try {
      const stored = localStorage.getItem('legal_lens_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {}
  }

  notify(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('legal_lens_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('legal_lens_user');
    }
    this.listeners.forEach(l => l(user));
  }

  addListener(cb: (user: User | null) => void) {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }
}

export const auth = new MockAuth();
export const getAuth = () => auth;
export class GoogleAuthProvider {}
export const googleProvider = new GoogleAuthProvider();

export const onAuthStateChanged = (authInstance: any, callback: (user: User | null) => void) => {
  return (authInstance as MockAuth).addListener(callback);
};

export const signInWithPopup = async (authInstance: any, provider: any) => {
  const user: User = {
    uid: 'mock-google-user-' + Date.now(),
    email: 'user@gmail.com',
    displayName: 'Google User',
    photoURL: null,
    metadata: { creationTime: new Date().toISOString() }
  };
  (authInstance as MockAuth).notify(user);
  return { user };
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 500));
  const user: User = {
    uid: 'mock-user-' + Date.now(),
    email,
    displayName: email.split('@')[0],
    photoURL: null,
    metadata: { creationTime: new Date().toISOString() }
  };
  (authInstance as MockAuth).notify(user);
  return { user };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  return signInWithEmailAndPassword(authInstance, email, pass);
};

export const signOut = async (authInstance: any) => {
  (authInstance as MockAuth).notify(null);
};

export const updateProfile = async (user: User, data: { displayName?: string, photoURL?: string }) => {
  if (user) {
    if (data.displayName) user.displayName = data.displayName;
    if (data.photoURL) user.photoURL = data.photoURL;
    auth.notify({ ...user });
  }
};

// --- Firestore Mocks ---

export const db = {};
export const getFirestore = (app: any) => db;

export const collection = (db: any, path: string) => ({ path });

export const addDoc = async (coll: any, data: any) => {
  console.log(`[MockFirestore] Added doc to ${coll.path}:`, data);
  return { id: 'mock-id-' + Date.now() };
};

export const serverTimestamp = () => new Date().toISOString();

export default app;
