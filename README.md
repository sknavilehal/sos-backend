# RRT Backend API

Express.js backend for handling SOS alerts and Firebase Cloud Messaging.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Update `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceaccount.json
FIREBASE_DATABASE_URL=https://your-firebase-project.firebaseio.com
PORT=3000
```

### 3. Firebase Service Account
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate private key
3. Save as `serviceaccount.json` in backend root

### 4. Run Server
```bash
node server.js
```

## API Endpoints

### Health Check
```
GET /api/health
Response: { "status": "OK", "firebase": "connected" }
```

### Send SOS Alert
```
POST /api/sos
Body: {
  "userId": "string",
  "district": "string", 
  "latitude": number,
  "longitude": number,
  "timestamp": "ISO string"
}
Response: { "success": true, "alertId": "string" }
```

## Local Development

Use ngrok to expose local server:
```bash
ngrok http 3000
# Use generated URL in Flutter app's ApiConfig
```

## Firebase Integration

- Sends push notifications to district-based topics
- Topic format: `district-{districtName}`
- Requires valid service account JSON

---
For mobile app setup, see main README.md Setup Guide

## Prerequisites
- Node.js 14+ installed
- Firebase project with service account access

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Firebase Setup:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Settings → Service accounts
   - Generate new private key
   - Save as `serviceAccountKey.json` in this directory

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Edit .env and update:
   # FIREBASE_PROJECT_ID=your-actual-project-id
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with:

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
PORT=3000
NODE_ENV=development
PUBLIC_URL=http://localhost:3000
```

## Security Notes

- ⚠️ **Never commit `serviceAccountKey.json` to version control**
- ⚠️ **Never commit `.env` files with secrets**
- ✅ Use different service accounts for dev/staging/prod
- ✅ Rotate keys regularly in production

## API Endpoints

- `GET /health` - Health check
- `POST /api/sos` - Send SOS alert
- `POST /api/test-sos` - Test SOS endpoint

## Testing

```bash
# Health check
curl http://localhost:3000/health

# Test SOS
curl -X POST http://localhost:3000/api/test-sos
```

## Production Deployment

1. Use environment variables instead of local files
2. Set up proper HTTPS certificates
3. Configure proper CORS origins
4. Enable request rate limiting
5. Set up monitoring and logging