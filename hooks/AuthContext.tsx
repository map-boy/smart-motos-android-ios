import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import {
  auth,
  onAuthStateChange,
  sendOtp,
  confirmOtp,
  createPassengerProfile,
  createDriverProfile,
  uploadLicenseImage,
  getAccountDetails,
  uploadProfilePhoto,
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
  signOut as firebaseSignOut,
  type AccountDetails,
  type DriverOnboardingData,
} from '@/services/auth';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'driver' | 'passenger' | 'admin';
  photoUrl: string | null;
  walletBalance: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  otpPending: boolean;
  requestOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (
    code: string,
    signupData?: { name: string; email?: string },
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  googleAuth: (
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  signUpEmail: (
    email: string,
    password: string,
    signupData?: { name: string; phone?: string },
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  signInEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfilePhoto: (localUri: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpPending, setOtpPending] = useState(false);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const accountResponse = await getAccountDetails();
        if (accountResponse.success && accountResponse.data) {
          const data: AccountDetails = accountResponse.data;
          setUser({
            id: data.uid,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            photoUrl: data.photoUrl,
            walletBalance: data.walletBalance,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const requestOtp = async (phone: string) => {
    const result = await sendOtp(phone);
    if (result.success) {
      setPendingPhone(phone);
      setOtpPending(true);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const verifyOtp = async (
    code: string,
    signupData?: { name: string; email?: string },
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => {
    const result = await confirmOtp(code);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    setOtpPending(false);

    if (signupData && pendingPhone) {
      const profileResult = await createPassengerProfile(result.data.uid, {
        name: signupData.name,
        email: signupData.email,
        phone: pendingPhone,
      });
      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }
    }

    if (driverData && pendingPhone) {
      let licenseImageUrl: string | undefined;
      if (driverData.licenseImageUri) {
        const uploadResult = await uploadLicenseImage(result.data.uid, driverData.licenseImageUri);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        licenseImageUrl = uploadResult.data;
      }
      const profileResult = await createDriverProfile(result.data.uid, {
        name: driverData.name,
        phone: pendingPhone,
        service_provider: driverData.service_provider,
        vehicle_type: driverData.vehicle_type,
        license_number: driverData.license_number,
        licenseImageUrl,
      } as any);
      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }
    }

    const accountResponse = await getAccountDetails();
    if (accountResponse.success && accountResponse.data) {
      const data: AccountDetails = accountResponse.data;
      setUser({
        id: data.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        photoUrl: data.photoUrl,
        walletBalance: data.walletBalance,
      });
      return { success: true };
    }

    return { success: false, error: 'Signed in, but no profile found.' };
  };

  const googleAuth = async (
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => {
    const result = await signInWithGoogle();
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const { user: fbUser, isNewUser } = result.data;

    if (isNewUser) {
      if (driverData) {
        let licenseImageUrl: string | undefined;
        if (driverData.licenseImageUri) {
          const uploadResult = await uploadLicenseImage(fbUser.uid, driverData.licenseImageUri);
          if (!uploadResult.success) {
            return { success: false, error: uploadResult.error };
          }
          licenseImageUrl = uploadResult.data;
        }
        const profileResult = await createDriverProfile(fbUser.uid, {
          name: driverData.name || fbUser.displayName || 'Driver',
          phone: driverData.phone,
          service_provider: driverData.service_provider,
          vehicle_type: driverData.vehicle_type,
          license_number: driverData.license_number,
          licenseImageUrl,
        } as any);
        if (!profileResult.success) {
          return { success: false, error: profileResult.error };
        }
      } else {
        const profileResult = await createPassengerProfile(fbUser.uid, {
          name: fbUser.displayName || 'User',
          email: fbUser.email || undefined,
          phone: fbUser.phoneNumber || '',
        });
        if (!profileResult.success) {
          return { success: false, error: profileResult.error };
        }
      }
    }

    const accountResponse = await getAccountDetails();
    if (accountResponse.success && accountResponse.data) {
      const data: AccountDetails = accountResponse.data;
      setUser({
        id: data.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        photoUrl: data.photoUrl,
        walletBalance: data.walletBalance,
      });
      return { success: true, isNewUser };
    }

    return { success: false, error: 'Signed in, but no profile found.' };
  };

  const signUpEmail = async (
    email: string,
    password: string,
    signupData?: { name: string; phone?: string },
    driverData?: DriverOnboardingData & { licenseImageUri?: string }
  ) => {
    const result = await signUpWithEmail(email, password);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const uid = result.data.uid;

    if (driverData) {
      let licenseImageUrl: string | undefined;
      if (driverData.licenseImageUri) {
        const uploadResult = await uploadLicenseImage(uid, driverData.licenseImageUri);
        if (!uploadResult.success) {
          return { success: false, error: uploadResult.error };
        }
        licenseImageUrl = uploadResult.data;
      }
      const profileResult = await createDriverProfile(uid, {
        name: driverData.name,
        phone: driverData.phone,
        service_provider: driverData.service_provider,
        vehicle_type: driverData.vehicle_type,
        license_number: driverData.license_number,
        licenseImageUrl,
      } as any);
      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }
    } else {
      const profileResult = await createPassengerProfile(uid, {
        name: signupData?.name || '',
        email,
        phone: signupData?.phone,
      });
      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }
    }

    const accountResponse = await getAccountDetails();
    if (accountResponse.success && accountResponse.data) {
      const data: AccountDetails = accountResponse.data;
      setUser({
        id: data.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        photoUrl: data.photoUrl,
        walletBalance: data.walletBalance,
      });
      return { success: true };
    }
    return { success: false, error: 'Signed up, but no profile found.' };
  };

  const signInEmail = async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    const accountResponse = await getAccountDetails();
    if (accountResponse.success && accountResponse.data) {
      const data: AccountDetails = accountResponse.data;
      setUser({
        id: data.uid,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        photoUrl: data.photoUrl,
        walletBalance: data.walletBalance,
      });
      return { success: true, role: data.role };
    }
    return { success: false, error: 'Signed in, but no profile found.' };
  };

  const resetPassword = async (email: string) => {
    return await sendPasswordReset(email);
  };

  const signOut = async () => {
    await firebaseSignOut();
    setUser(null);
  };
  const updateProfilePhoto = async (localUri: string) => {
    if (!user) {
      return { success: false, error: 'Not signed in' };
    }
    const result = await uploadProfilePhoto(user.id, localUri);
    if (result.success && result.data) {
      setUser({ ...user, photoUrl: result.data });
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, otpPending, requestOtp, verifyOtp, signOut, googleAuth, signUpEmail, signInEmail, resetPassword, updateProfilePhoto }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

