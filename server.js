const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
  
  firebaseInitialized = true;
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  console.log('Make sure to:');
  console.log('1. Download service account key from Firebase Console');
  console.log('2. Place it in the backend directory');
  console.log('3. Update FIREBASE_SERVICE_ACCOUNT_PATH in .env');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    firebase: firebaseInitialized ? 'connected' : 'disconnected'
  });
});

// SOS Alert endpoint
app.post('/api/sos', async (req, res) => {
  console.log('📡 SOS request received:', req.body);
  
  if (!firebaseInitialized) {
    return res.status(500).json({ 
      error: 'Firebase not initialized',
      message: 'Server configuration error'
    });
  }

  try {
    const { district, location, userInfo, timestamp } = req.body;
    
    // Validate required fields
    if (!district || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['district', 'location']
      });
    }

    console.log(`🚨 Sending SOS alert to district: ${district}`);
    
    // Prepare FCM message
    const message = {
      topic: `district-${district}`,
      notification: {
        title: '🚨 Emergency Alert',
        body: `SOS alert in ${district.toUpperCase()} area`
      },
      data: {
        type: 'sos_alert',
        district: district,
        location: JSON.stringify(location),
        timestamp: timestamp || Date.now().toString(),
        userInfo: userInfo ? JSON.stringify(userInfo) : '{}',
        alertId: `sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF0000',
          sound: 'default',
          priority: 'high',
          defaultSound: true
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: '🚨 Emergency Alert',
              body: `SOS alert in ${district.toUpperCase()} area`
            },
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    // Send FCM message
    const response = await admin.messaging().send(message);
    
    console.log('✅ SOS alert sent successfully:', response);
    
    res.json({ 
      success: true, 
      message: 'SOS alert sent successfully',
      messageId: response,
      topic: `district-${district}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ SOS send error:', error);
    
    res.status(500).json({ 
      error: 'Failed to send SOS alert',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to manually trigger SOS (for testing)
app.post('/api/test-sos', async (req, res) => {
  const testData = {
    district: 'bengaluru_urban',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'Test Location, Bangalore'
    },
    userInfo: {
      deviceId: 'test-device',
      appVersion: '1.0.0'
    },
    timestamp: Date.now().toString()
  };
  
  // Forward to main SOS endpoint
  req.body = testData;
  return app._router.handle({ ...req, method: 'POST', url: '/api/sos' }, res);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/sos',
      'POST /api/test-sos'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 RRT Backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🆘 SOS endpoint: http://localhost:${PORT}/api/sos`);
  console.log(`🧪 Test SOS: http://localhost:${PORT}/api/test-sos`);
  
  if (!firebaseInitialized) {
    console.log('\n⚠️  Firebase not configured. Follow setup instructions above.');
  }
});