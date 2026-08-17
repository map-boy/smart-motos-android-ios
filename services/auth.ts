// Firebase Auth + Firestore user profiles.
// Replaces the old Express/Render REST auth (services/auth.ts).
// Login is now OTP-based (no passwords) -- see sendOtp / confirmOtp.

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '532787193673-mav1ei5nhqsf2neg0gjeammvnb873i88.apps.googleusercontent.com',
});

/** Signs in with Google. Returns the Firebase user + whether this is their first sign-in. */
export const signInWithGoogle = async (): Promise<ApiResponse<{ user: FirebaseAuthTypes.User; isNewUser: boolean }>> => {
  try {
    await GoogleSignin.hasPlayServices();
    const signInResult: any = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken ?? signInResult?.idToken;
    if (!idToken) {
      return { success: false, error: 'No ID token returned from Google' };
    }
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    return {
      success: true,
      data: {
        user: userCredential.user,
        isNewUser: !!userCredential.additionalUserInfo?.isNewUser,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Google sign-in failed' };
  }
};

/** Creates a new user with email + password. */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
  try {
    const credential = await auth().createUserWithEmailAndPassword(email, password);
    return { success: true, data: credential.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create account' };
  }
};

/** Signs in an existing user with email + password. */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
  try {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return { success: true, data: credential.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Invalid email or password' };
  }
};

/** Sends a password reset email. */
export const sendPasswordReset = async (email: string): Promise<ApiResponse> => {
  try {
    await auth().sendPasswordResetEmail(email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send reset email' };
  }
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AccountDetails {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin';
  photoUrl: string | null;
  walletBalance: number;
}

export interface DriverOnboardingData {
  name: string;
  phone?: string;
  service_provider: 'MTN' | 'Airtel';
  vehicle_type: 'bike' | 'car';
  license_number: string;
  license_image_uri?: string;
}

let confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

/**
 * Step 1 of login/signup: sends an OTP SMS.
 * Phone must be E.164 format, e.g. +2507XXXXXXXX
 */
export const sendOtp = async (phone: string): Promise<ApiResponse> => {
  try {
    confirmationResult = await auth().signInWithPhoneNumber(phone);
    return { success: true, message: 'OTP sent' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send OTP' };
  }
};

/**
 * Step 2 of login/signup: confirms the code the user typed.
 * On success the user is signed into Firebase Auth.
 */
export const confirmOtp = async (
  code: string
): Promise<ApiResponse<FirebaseAuthTypes.User>> => {
  try {
    if (!confirmationResult) {
      return { success: false, error: 'No OTP request in progress. Call sendOtp first.' };
    }
    const credential = await confirmationResult.confirm(code);
    confirmationResult = null;
    if (!credential?.user) {
      return { success: false, error: 'Verification failed' };
    }
    return { success: true, data: credential.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Invalid code' };
  }
};

/** Creates the Firestore profile for a brand-new passenger. Call after confirmOtp() on signup. */
export const createPassengerProfile = async (
  uid: string,
  data: { name: string; email?: string; phone?: string }
): Promise<ApiResponse> => {
  try {
    await firestore().collection('users').doc(uid).set({
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      role: 'passenger',
      photoUrl: null,
      walletBalance: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create profile' };
  }
};

/** Creates the Firestore profile for a brand-new driver, including onboarding fields. */
/** Uploads a driver's license photo to Firebase Storage. Returns the download URL. */
export const uploadLicenseImage = async (
  uid: string,
  localUri: string
): Promise<ApiResponse<string>> => {
  try {
    const ref = storage().ref(`driver-licenses/${uid}.jpg`);
    await ref.putFile(localUri);
    const url = await ref.getDownloadURL();
    return { success: true, data: url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to upload license image' };
  }
};
export const uploadProfilePhoto = async (
  uid: string,
  localUri: string
): Promise<ApiResponse<string>> => {
  try {
    const ref = storage().ref(`profile-photos/.jpg`);
    await ref.putFile(localUri);
    const url = await ref.getDownloadURL();
    await firestore().collection('users').doc(uid).update({ photoUrl: url });
    return { success: true, data: url };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to upload profile photo' };
  }
};
export const createDriverProfile = async (
  uid: string,
  data: DriverOnboardingData
): Promise<ApiResponse> => {
  try {
    await firestore().collection('users').doc(uid).set({
      name: data.name,
      phone: data.phone,
      role: 'driver',
      serviceProvider: data.service_provider,
      vehicleType: data.vehicle_type,
      licenseNumber: data.license_number,
      licenseImageUrl: data.licenseImageUrl || null,
      status: 'pending_verification',
      isAvailable: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create driver profile' };
  }
};

/** Fetches the signed-in user's profile. Replaces GET /account/details and GET /driver/profile. */
export const getAccountDetails = async (): Promise<ApiResponse<AccountDetails>> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    const doc = await firestore().collection('users').doc(currentUser.uid).get();
    if (!doc.exists) {
      return { success: false, error: 'Profile not found' };
    }
    const data = doc.data()!;
    return {
      success: true,
      data: {
        uid: currentUser.uid,
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        role: data.role,
        photoUrl: data.photoUrl || null,
        walletBalance: data.walletBalance || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to fetch account details' };
  }
};

/** Updates profile fields. Replaces PUT /account/details. */
export const updateAccountDetails = async (
  details: Partial<Pick<AccountDetails, 'name' | 'email'>>
): Promise<ApiResponse> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }
    await firestore().collection('users').doc(currentUser.uid).update(details);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update account details' };
  }
};

/** Firebase ID token -- pass this as a Bearer token to any Cloud Function that still needs one (e.g. payments). */
export const getAuthToken = async (): Promise<string> => {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) return '';
    return await currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

export const onAuthStateChange = (
  callback: (user: FirebaseAuthTypes.User | null) => void
) => {
  return auth().onAuthStateChanged(callback);
};



