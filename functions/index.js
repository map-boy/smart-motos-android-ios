const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "africa-south1" });

const db = admin.firestore();
const messaging = admin.messaging();

const STATUS_MESSAGES = {
  driver_assigned: { title: "Driver Assigned", body: "A driver is on the way to your pickup location." },
  in_progress: { title: "Ride Started", body: "Your ride is now in progress." },
  completed: { title: "Ride Completed", body: "You have arrived. Thanks for riding with Smart Motos!" },
  cancelled: { title: "Ride Cancelled", body: "Your ride has been cancelled." },
};

async function sendPushToUser(userId, title, body, data = {}) {
  if (!userId) return;
  const userDoc = await db.collection("users").doc(userId).get();
  const token = userDoc.data()?.fcmToken;
  if (!token) {
    console.log(`No fcmToken for user ${userId}, skipping push.`);
    return;
  }
  try {
    await messaging.send({
      token,
      notification: { title, body },
      data,
      android: { priority: "high" },
    });
  } catch (err) {
    console.error(`Failed to send push to ${userId}:`, err.message);
  }
}

exports.onRideStatusChange = onDocumentUpdated("rides/{rideId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const rideId = event.params.rideId;

  if (before.status === after.status) return;

  const statusInfo = STATUS_MESSAGES[after.status];
  if (!statusInfo) return;

  const { title, body } = statusInfo;

  await Promise.all([
    sendPushToUser(after.riderId, title, body, { rideId, type: "ride", status: after.status }),
    db.collection("notifications").add({
      userId: after.riderId,
      userType: "passenger",
      title,
      message: body,
      type: "ride",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }),
  ]);

  if (after.status === "driver_assigned" && after.driverId) {
    await sendPushToUser(
      after.driverId,
      "Ride Assigned",
      "You have been assigned a new ride.",
      { rideId, type: "ride", status: after.status }
    );
  }
});

exports.onNotificationCreated = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const notif = event.data.data();
  if (!notif?.userId || notif.type === "ride") return;
  await sendPushToUser(notif.userId, notif.title, notif.message, { type: notif.type || "general" });
});
