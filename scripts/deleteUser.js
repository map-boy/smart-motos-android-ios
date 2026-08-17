const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/deleteUser.js <uid>');
  process.exit(1);
}

async function main() {
  await getAuth().deleteUser(uid);
  await getFirestore().collection('users').doc(uid).delete();
  console.log('Deleted user:', uid);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
