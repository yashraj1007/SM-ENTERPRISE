# Local Machine Setup Guide

Follow these steps to ensure the **SM ENTERPRISE & LAPTOP HOUSE** Admin Panel works correctly on your local machine.

## 1. Environment Configuration
- Copy `.env.example` to a new file named `.env`.
- Get a Gemini API Key from [AI Studio](https://aistudio.google.com/app/apikey) and add it to `GEMINI_API_KEY`.
- Set `APP_URL=http://localhost:3000`.

## 2. Firebase Project Setup
- Ensure your `firebase-applet-config.json` file is in the root directory.
- **Authorized Domains**: Go to Firebase Console > Authentication > Settings > Authorized domains and add `localhost`.
- **Firestore Rules**: Deploy the project's rules using:
  ```bash
  firebase deploy --only firestore:rules
  ```
- **Firestore Indexes**: The Admin Panel uses sorted queries. If the data doesn't load, check your browser console (F12). Firebase will usually provide a link to automatically generate the required composite indexes.

## 3. Database Roles
- A user must have a document in the `users` collection with the field `role: "admin"`.
- This is automatically assigned to `yashrajbhore1107@gmail.com` on first login, as defined in `src/App.tsx`.

## 4. Run the Application
```bash
# Install dependencies
npm install

# Start the dev server (Vite + Express)
npm run dev
```

## 5. Troubleshooting
- **Missing or insufficient permissions**: You probably aren't logged in with the correct account or the rules haven't been deployed.
- **Port 3000 busy**: Ensure no other process is using port 3000, as the backend is hardcoded to this port.
- **Uploading fails**: Ensure your local process has permission to write to the `uploads/` directory in the project root.
