const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendNotifications() {
  try {
    const tokens = JSON.parse(process.env.FCM_TOKENS);
    const title = process.env.NOTIFICATION_TITLE;
    const body = process.env.NOTIFICATION_BODY;
    
    console.log(`Sending notifications to ${tokens.length} devices`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    
    if (tokens.length === 0) {
      console.log('No tokens provided');
      return;
    }
    
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'team_ping',
        timestamp: Date.now().toString(),
        action: 'open_mining'
      },
      android: {
        notification: {
          channelId: 'team_notifications',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          icon: 'ic_launcher',
          sound: 'default'
        }
      },
      tokens: tokens
    };
    
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Successfully sent: ${response.successCount}`);
    console.log(`Failed: ${response.failureCount}`);
    
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${idx}: ${resp.error}`);
        }
      });
    }
    
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success &&
          (resp.error.code === 'messaging/registration-token-not-registered' ||
           resp.error.code === 'messaging/invalid-registration-token')) {
        invalidTokens.push(tokens[idx]);
      }
    });
    
    if (invalidTokens.length > 0) {
      console.log(`Invalid tokens found: ${invalidTokens.length}`);
    }
    
  } catch (error) {
    console.error('Error sending notifications:', error);
    process.exit(1);
  }
}

sendNotifications();
