const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const db = getFirestore();

const phone = process.argv[2];
const name = process.argv[3];

if (!phone || !name) {
  console.error('Usage: node scripts/createAdmin.js "+2507XXXXXXXX" "Admin Name"');
  process.exit(1);
}

async function main() {
  const userRecord = await auth.createUser({
    phoneNumber: phone,
    displayName: name,
  });

  await db.collection('users').doc(userRecord.uid).set({
    name,
    phone,
    email: '',
    role: 'admin',
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log('Admin created:');
  console.log('UID:', userRecord.uid);
  console.log('Phone:', phone);
}

main().catch((err) => {
  console.error('Error creating admin:', err.message);
  process.exit(1);
});
