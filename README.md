# RRT Backend Setup Guide

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