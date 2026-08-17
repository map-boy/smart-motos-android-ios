import firestore from '@react-native-firebase/firestore';

const topupsRef = firestore().collection('topups');
const usersRef = firestore().collection('users');

export interface TopupRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export const createTopupRequest = async (
  userId: string,
  userName: string,
  amount: number
): Promise<void> => {
  await topupsRef.add({
    userId,
    userName,
    amount,
    status: 'pending',
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const listenToPendingTopups = (
  callback: (topups: TopupRequest[]) => void
): (() => void) => {
  return topupsRef
    .where('status', '==', 'pending')
    .onSnapshot((snapshot) => {
      callback(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TopupRequest))
      );
    });
};

export const approveTopup = async (topupId: string, userId: string, amount: number): Promise<void> => {
  await topupsRef.doc(topupId).update({ status: 'approved' });
  await usersRef.doc(userId).update({
    walletBalance: firestore.FieldValue.increment(amount),
  });
};

export const rejectTopup = async (topupId: string, reason?: string): Promise<void> => {
  await topupsRef.doc(topupId).update({ status: 'rejected', rejectionReason: reason || null });
};