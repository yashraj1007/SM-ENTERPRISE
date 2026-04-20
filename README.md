# Hosting Your SM ENTERPRISE & LAPTOP HOUSE App

This project is built with **React + Vite + Firebase**. To host it, you need to "build" the project first, which generates standard HTML, CSS, and JavaScript files.

## Option 1: Quick Hosting (Vercel / Netlify)
1. Push this code to a **GitHub** repository.
2. Link the repository to **Vercel** or **Netlify**.
3. Set the following Build Settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add your **Environment Variables** (from `.env.example`) into the host's dashboard.

## Option 2: Traditional Web Hosting (FTP/cPanel)
1. Run the command `npm run build` in your terminal.
2. A folder named `dist` will be created.
3. Upload the **contents** of the `dist` folder to your server's `public_html` or root directory.

## Option 3: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase init` and choose **Hosting**.
3. Set the public directory to `dist`.
4. Run `npm run build` and then `firebase deploy`.

## Option 4: Docker (VPS/Cloud Run)
We have included a `Dockerfile`. You can build and run it using:
```bash
docker build -t laptop-house .
docker run -p 3000:3000 laptop-house
```

## Security Note for Admin Portal
The Admin Portal is secured with the credentials:
- **Username:** SMENTERPRISE
- **Password:** admin1234
