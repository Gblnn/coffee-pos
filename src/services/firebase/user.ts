import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import app from "../../config/firebase";
import { UserData, UserRole } from "../../types/auth";

const db = getFirestore(app);

export const createUserData = async (
  user: { uid: string; email: string | null; displayName?: string | null },
  role: UserRole
): Promise<void> => {
  const userData: UserData = {
    uid: user.uid,
    email: user.email,
    role,
    displayName: user.displayName || null,
  };
  await setDoc(doc(db, "users", user.uid), userData);
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  console.log("Fetching user data for uid:", uid);
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  console.log(
    "Firestore response:",
    docSnap.exists() ? docSnap.data() : "No data"
  );
  if (!docSnap.exists()) return null;
  return docSnap.data() as UserData;
};

export const subscribeToUserData = (
  uid: string,
  callback: (userData: UserData | null) => void
): (() => void) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }
    callback(doc.data() as UserData);
  });
};

export const setUserRole = async (
  uid: string,
  role: UserRole
): Promise<void> => {
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
};

export const hasRole = (
  user: UserData | null,
  requiredRole: UserRole | UserRole[]
): boolean => {
  if (!user) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }

  return user.role === requiredRole;
};

export const getAllUsers = async (): Promise<UserData[]> => {
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  return snapshot.docs.map((doc) => doc.data() as UserData);
};

export const updateUserData = async (
  uid: string,
  updates: Partial<Omit<UserData, "uid">>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
};

export const deleteUserData = async (uid: string) => {
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user data:", error);
    throw error;
  }
};
