# Firebase Service Account Setup Instructions

## Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you haven't already)

## Step 2: Generate Service Account Key
1. Click on the **Settings (⚙️) icon** in the left sidebar
2. Select **"Project settings"**
3. Navigate to the **"Service accounts"** tab
4. Click **"Generate new private key"**
5. A dialog will appear asking for confirmation
6. Click **"Generate key"** to download the JSON file

## Step 3: Setup Backend Configuration
1. **Rename the downloaded file** to `serviceAccountKey.json`
2. **Copy the file** to your backend directory:
   ```bash
   cp ~/Downloads/your-project-name-firebase-adminsdk-xxxxx.json /Users/shamnr/rrt-app/rrt-backend/serviceAccountKey.json
   ```
3. **Update the .env file** with your project details:
   ```bash
   cd /Users/shamnr/rrt-app/rrt-backend
   ```
   Edit `.env` file and replace:
   ```env
   FIREBASE_PROJECT_ID=your-actual-project-id
   ```
   With your actual Firebase project ID (found in project settings)

## Step 4: Security Setup
1. **Add to .gitignore** to prevent accidentally committing the service account key:
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   echo ".env" >> .gitignore
   ```

## Step 5: Test Backend Setup
1. **Start the server:**
   ```bash
   npm run dev
   ```
2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```
   You should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-...",
     "firebase": "connected"
   }
   ```

## Step 6: For Physical Device Testing (ngrok)
1. **Install ngrok** (if not already installed):
   ```bash
   brew install ngrok
   ```
   or download from [https://ngrok.com/download](https://ngrok.com/download)

2. **Start your backend server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, expose the server:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output (looks like: `https://abc123.ngrok.io`)

5. **Update .env file:**
   ```env
   PUBLIC_URL=https://your-ngrok-url.ngrok.io
   ```

## Troubleshooting

### If Firebase shows "disconnected":
- Verify the `serviceAccountKey.json` file is in the backend directory
- Check that `FIREBASE_PROJECT_ID` matches your project ID exactly
- Ensure the service account key file path is correct in `.env`

### If server won't start:
- Check that all npm dependencies are installed: `npm install`
- Verify Node.js version: `node --version` (requires Node.js 14+)
- Check for port conflicts: `lsof -i :3000`

### If ngrok fails:
- Make sure your backend is running on port 3000
- Verify ngrok is properly installed
- Try a different port: `ngrok http 3001` (and update PORT in .env)

## Security Notes
- **Never commit** `serviceAccountKey.json` to version control
- **Use different service accounts** for development/production
- **Rotate keys regularly** in production environments
- **Restrict permissions** to only what's needed for FCM