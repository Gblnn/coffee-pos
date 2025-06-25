import { LoadingScreen } from "@/components/common/LoadingScreen";
import { subscribeToUserData } from "@/services/firebase/user";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import {
  clearLocalAuth,
  getLocalUserData,
  saveUserDataToLocal,
} from "../services/auth/offlineAuth";
import { createUserData, getUserData } from "../services/firebase/user";
import { UserData, UserRole } from "../types/auth";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isOnline: boolean;
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  // First, get the cached user data
  const cachedUserData = getLocalUserData();

  const createMinimalUser = (data: UserData): User =>
    ({
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      // Add required User properties with default values
      emailVerified: false,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      phoneNumber: null,
      photoURL: null,
      providerId: "firebase",
      delete: async () => {
        throw new Error("Not implemented");
      },
      getIdToken: async () => "",
      getIdTokenResult: async () => ({
        token: "",
        claims: {},
        authTime: "",
        issuedAtTime: "",
        expirationTime: "",
        signInProvider: null,
        signInSecondFactor: null,
      }),
      reload: async () => {},
      toJSON: () => ({}),
    } as unknown as User); // Use double type assertion to handle complex Firebase types

  const [user, setUser] = useState<User | null>(() => {
    // Initialize with cached data immediately
    if (!cachedUserData) return null;
    // Create a minimal User object from UserData
    return createMinimalUser(cachedUserData);
  });

  const [userData, setUserData] = useState<UserData | null>(
    () => cachedUserData
  );
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Add effect to handle auth state changes and redirects
  useEffect(() => {
    // If no user data is found, redirect to login
    if (!user && !userData && !loading) {
      navigate("/login");
    }
  }, [user, userData, loading, navigate]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isOnline) {
      console.log("Offline mode: using cached data");
      if (cachedUserData) {
        console.log("Using cached user data:", cachedUserData);
        setUserData(cachedUserData);
        setUser((prev) => prev || createMinimalUser(cachedUserData));
      }
      return;
    }

    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );
      if (firebaseUser) {
        try {
          console.log("Attempting to fetch user data for:", firebaseUser.uid);
          const initialUserData = await getUserData(firebaseUser.uid);
          console.log("Received initial user data:", initialUserData);

          if (initialUserData) {
            setUserData(initialUserData);
            saveUserDataToLocal(initialUserData);
            setUser(firebaseUser);
          } else {
            console.warn(
              "No user data found in Firestore for uid:",
              firebaseUser.uid
            );
          }

          const unsubscribeUserData = subscribeToUserData(
            firebaseUser.uid,
            (freshUserData) => {
              console.log("Received user data update:", freshUserData);
              if (freshUserData) {
                if (
                  JSON.stringify(freshUserData) !== JSON.stringify(userData)
                ) {
                  setUserData(freshUserData);
                  saveUserDataToLocal(freshUserData);
                  setUser(
                    (prev) =>
                      ({
                        ...prev!,
                        displayName: freshUserData.displayName,
                        email: freshUserData.email,
                      } as User)
                  );
                }
              }
            }
          );

          return () => unsubscribeUserData();
        } catch (error) {
          console.error("Error fetching user data:", error);
          // If we have cached data, use it as fallback
          if (cachedUserData) {
            setUserData(cachedUserData);
            setUser((prev) => prev || createMinimalUser(cachedUserData));
          } else {
            setUserData(null);
            setUser(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        clearLocalAuth();
      }
    });

    return unsubscribe;
  }, [isOnline]);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "user"
  ) => {
    setLoading(true);
    try {
      console.log("Creating new user with role:", role);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created, creating user data in Firestore");
      await createUserData(userCredential.user, role);
      console.log("User data created in Firestore");
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in user");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("User signed in, fetching user data");
      const userDataResult = await getUserData(userCredential.user.uid);
      console.log("Fetched user data after sign in:", userDataResult);

      if (userDataResult) {
        setUserData(userDataResult);
        saveUserDataToLocal(userDataResult);
        setUser(userCredential.user);
      } else {
        console.warn(
          "No user data found after sign in for uid:",
          userCredential.user.uid
        );
        saveUserDataToLocal(null);
        setUserData(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      if (!isOnline) {
        const cachedUserData = getLocalUserData();
        if (cachedUserData) {
          setUser({
            uid: cachedUserData.uid,
            email: cachedUserData.email,
            displayName: cachedUserData.displayName,
          } as User);
          setUserData(cachedUserData);
          return;
        }
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // Check if user data exists, if not create it
      const existingUserData = await getUserData(result.user.uid);
      if (!existingUserData) {
        await createUserData(result.user, "user");
      }

      const userDataResult = await getUserData(result.user.uid);
      if (userDataResult) {
        setUserData(userDataResult);
        saveUserDataToLocal(userDataResult);
      }
    } catch (error) {
      console.error("Error during Google sign in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      clearLocalAuth();
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userData) return false;

    if (Array.isArray(role)) {
      return role.includes(userData.role);
    }

    return userData.role === role;
  };

  const value = {
    user,
    userData,
    loading,
    isOnline,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    hasRole,
  };

  // Only show loading screen for auth operations other than login
  if (loading && !window.location.pathname.includes("/login")) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
