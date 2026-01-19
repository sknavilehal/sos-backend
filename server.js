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

// District discovery function based on coordinates
function getDistrictFromCoordinates(latitude, longitude) {
  // Check if this is a simulator location (San Francisco area) first
  if (latitude >= 37.7 && latitude <= 37.8 && longitude >= -122.5 && longitude <= -122.3) {
    console.log('Detected iOS Simulator location, using test district');
    return 'bengaluru_urban'; // Return test district for simulator
  }
  
  // Define major city boundaries across India
  const districtBounds = [
    // Karnataka Districts
    { name: 'bengaluru_urban', bounds: { north: 13.15, south: 12.85, east: 77.75, west: 77.45 } },
    { name: 'mysuru', bounds: { north: 12.5, south: 12.0, east: 76.8, west: 76.5 } },
    { name: 'mangaluru', bounds: { north: 13.0, south: 12.7, east: 75.0, west: 74.7 } },
    
    // Maharashtra Districts
    { name: 'mumbai', bounds: { north: 19.30, south: 18.90, east: 72.95, west: 72.75 } },
    { name: 'pune', bounds: { north: 18.65, south: 18.45, east: 73.95, west: 73.75 } },
    { name: 'nagpur', bounds: { north: 21.25, south: 21.05, east: 79.15, west: 78.95 } },
    
    // Delhi NCR
    { name: 'new_delhi', bounds: { north: 28.88, south: 28.40, east: 77.35, west: 76.84 } },
    { name: 'gurgaon', bounds: { north: 28.52, south: 28.38, east: 77.12, west: 76.95 } },
    { name: 'noida', bounds: { north: 28.65, south: 28.45, east: 77.45, west: 77.25 } },
    
    // Tamil Nadu Districts
    { name: 'chennai', bounds: { north: 13.23, south: 12.83, east: 80.35, west: 80.10 } },
    { name: 'coimbatore', bounds: { north: 11.1, south: 10.9, east: 77.1, west: 76.9 } },
    { name: 'madurai', bounds: { north: 9.95, south: 9.85, east: 78.15, west: 78.05 } },
    
    // West Bengal Districts
    { name: 'kolkata', bounds: { north: 22.65, south: 22.45, east: 88.45, west: 88.25 } },
    
    // Telangana Districts
    { name: 'hyderabad', bounds: { north: 17.55, south: 17.25, east: 78.65, west: 78.25 } },
    
    // Gujarat Districts
    { name: 'ahmedabad', bounds: { north: 23.15, south: 22.95, east: 72.75, west: 72.45 } },
    { name: 'surat', bounds: { north: 21.25, south: 21.15, east: 72.85, west: 72.75 } },
    
    // Rajasthan Districts
    { name: 'jaipur', bounds: { north: 26.95, south: 26.85, east: 75.85, west: 75.75 } },
    
    // Uttar Pradesh Districts
    { name: 'lucknow', bounds: { north: 26.95, south: 26.75, east: 81.05, west: 80.85 } },
    { name: 'kanpur', bounds: { north: 26.55, south: 26.35, east: 80.45, west: 80.25 } },
    
    // Kerala Districts
    { name: 'thiruvananthapuram', bounds: { north: 8.65, south: 8.45, east: 76.95, west: 76.75 } },
    { name: 'kochi', bounds: { north: 10.05, south: 9.85, east: 76.35, west: 76.15 } },
  ];

  // Check if location falls within any specific district
  for (const district of districtBounds) {
    const bounds = district.bounds;
    if (latitude <= bounds.north && latitude >= bounds.south && 
        longitude <= bounds.east && longitude >= bounds.west) {
      return district.name;
    }
  }

  // Fallback regional mapping for areas not covered by specific districts
  // Karnataka regions
  if (latitude >= 11.5 && latitude <= 18.5 && longitude >= 74.0 && longitude <= 78.5) {
    return 'karnataka_general';
  }
  // Maharashtra regions  
  if (latitude >= 15.5 && latitude <= 22.0 && longitude >= 72.5 && longitude <= 80.5) {
    return 'maharashtra_general';
  }
  // Tamil Nadu regions
  if (latitude >= 8.0 && latitude <= 13.5 && longitude >= 76.5 && longitude <= 80.5) {
    return 'tamil_nadu_general';
  }
  // Delhi NCR regions
  if (latitude >= 28.0 && latitude <= 29.0 && longitude >= 76.5 && longitude <= 77.5) {
    return 'delhi_ncr_general';
  }
  
  return 'india_general'; // Ultimate fallback
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
    const { sos_id, sos_type, location, userInfo, timestamp } = req.body;
    
    // Validate required fields
    if (!sos_id || !sos_type || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['sos_id', 'sos_type', 'location']
      });
    }

    // Validate sos_type
    if (!['sos_alert', 'stop'].includes(sos_type)) {
      return res.status(400).json({ 
        error: 'Invalid sos_type',
        message: 'sos_type must be either "sos_alert" or "stop"'
      });
    }

    // Determine district from coordinates
    const district = getDistrictFromCoordinates(location.latitude, location.longitude);
    
    if (sos_type === 'stop') {
      console.log(`🛑 Stopping SOS alert: ${sos_id}`);
      
      // Send stop notification to all devices in the district
      const stopMessage = {
        topic: `district-${district}`,
        notification: {
          title: '✅ Emergency Resolved',
          body: `Emergency situation in ${district.toUpperCase()} has been resolved`
        },
        data: {
          type: 'sos_resolved',
          sos_id: sos_id,
          district: district,
          timestamp: timestamp || Date.now().toString()
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#00FF00',
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: '✅ Emergency Resolved',
                body: `Emergency situation in ${district.toUpperCase()} has been resolved`
              },
              sound: 'default',
              badge: 0
            }
          }
        }
      };

      // Send stop FCM message
      const stopResponse = await admin.messaging().send(stopMessage);
      
      console.log('✅ Stop notification sent successfully:', stopResponse);
      
      return res.json({ 
        success: true, 
        message: 'SOS alert stopped successfully',
        messageId: stopResponse,
        sosId: sos_id,
        district: district,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🚨 Sending SOS alert to district: ${district} (ID: ${sos_id})`);
    
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
        alertId: sos_id
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
      sosId: sos_id,
      district: district,
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

// Get district information from coordinates
app.post('/api/get-district', (req, res) => {
  console.log('📍 District lookup request received:', req.body);
  
  try {
    const { latitude, longitude } = req.body;
    
    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['latitude', 'longitude']
      });
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid coordinate format',
        message: 'Latitude and longitude must be numbers'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid coordinate values',
        message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
      });
    }

    // Get district from coordinates
    const district = getDistrictFromCoordinates(latitude, longitude);
    
    console.log(`✅ District determined: ${district} for coordinates (${latitude}, ${longitude})`);
    
    res.json({ 
      success: true,
      district: district,
      fcm_topic: `district-${district}`,
      coordinates: {
        latitude: latitude,
        longitude: longitude
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ District lookup error:', error);
    
    res.status(500).json({ 
      error: 'Failed to determine district',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to manually trigger SOS (for testing)
app.post('/api/test-sos', async (req, res) => {
  const testData = {
    sos_id: `test_sos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sos_type: 'sos_alert',
    location: {
      latitude: 12.9716,
      longitude: 77.5946
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
      'POST /api/get-district',
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
  console.log(`🗺️  District lookup: http://localhost:${PORT}/api/get-district`);
  console.log(`🧪 Test SOS: http://localhost:${PORT}/api/test-sos`);
  
  if (!firebaseInitialized) {
    console.log('\n⚠️  Firebase not configured. Follow setup instructions above.');
  }
});