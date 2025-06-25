import { UserData } from "../../types/auth";

const USER_DATA_STORAGE_KEY = "user_data";

export const saveAuthToLocal = () => {
  // We don't need to save this separately anymore
  // The data will be saved in saveUserDataToLocal
};

export const saveUserDataToLocal = (userData: UserData | null) => {
  if (userData) {
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(USER_DATA_STORAGE_KEY);
  }
};

export const getLocalAuthData = () => {
  // Get the basic auth data from the full user data
  const userData = getLocalUserData();
  if (!userData) return null;

  return {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName,
    photoURL: null,
  };
};

export const getLocalUserData = () => {
  const userData = localStorage.getItem(USER_DATA_STORAGE_KEY);
  if (!userData) return null;
  return JSON.parse(userData) as UserData;
};

export const clearLocalAuth = () => {
  localStorage.removeItem(USER_DATA_STORAGE_KEY);
};
