# AK Event Planners — Full Stack Website

A luxury event planning website with a **Node.js + Express backend** that automatically sends booking emails via Gmail (Nodemailer) — no popups, no third-party services.

---

## 📁 Project Structure

```
ak-fullstack/
├── server.js           ← Express backend (email logic)
├── package.json        ← Node.js dependencies
├── vercel.json         ← Vercel deployment config
├── .env.example        ← Environment variables template
├── .gitignore          ← Ignore .env and node_modules
└── public/
    ├── index.html      ← Frontend (HTML/CSS/JS)
    └── logo.webp       ← AK Event Planners logo
```

---

## ⚡ How Email Works

When a client submits the booking form:
1. Frontend sends a **POST** request to `/api/book`
2. Backend validates the data
3. **Email 1** → Sent to `kartheebanaravindhan@gmail.com` with full booking details
4. **Email 2** → Confirmation sent to the **client's email** automatically
5. Frontend shows success/error message — no redirects, no popups

---

## 🔑 Step 1 — Get Gmail App Password

Your Gmail password won't work. You need a **16-character App Password**:

1. Go to → https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords** (search for it in the security page)
4. Select App: **Mail** → Device: **Other** → type "AK Events"
5. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

---

## 🖥️ Step 2 — Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Edit .env with your real values
#    GMAIL_USER=kartheebanaravindhan@gmail.com
#    GMAIL_APP_PASSWORD=your_16_char_app_password

# 4. Start the server
npm start

# Visit: http://localhost:3000
```

---

## 🚀 Step 3 — Deploy to Vercel (Free)

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project folder
vercel

# Set environment variables on Vercel
vercel env add GMAIL_USER
vercel env add GMAIL_APP_PASSWORD
vercel env add OWNER_EMAIL

# Deploy to production
vercel --prod
```

### Option B: GitHub + Vercel Dashboard
1. Push this folder to a **GitHub repository**
2. Go to https://vercel.com → **Import Project** → select your repo
3. In Vercel project settings → **Environment Variables** → add:
   - `GMAIL_USER` = `kartheebanaravindhan@gmail.com`
   - `GMAIL_APP_PASSWORD` = your 16-char app password
   - `OWNER_EMAIL` = `kartheebanaravindhan@gmail.com`
4. Click **Deploy** ✅

---

## 🌐 Alternative: Deploy to Railway (Also Free)

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway up

# Set env vars in Railway dashboard
```

---

## 📧 .env File (create this yourself — never commit to GitHub)

```env
GMAIL_USER=kartheebanaravindhan@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
OWNER_EMAIL=kartheebanaravindhan@gmail.com
PORT=3000
NODE_ENV=production
```

---

## 🔒 Security Features

- **Rate limiting** — max 5 bookings per IP per 15 minutes
- **Server-side validation** — all fields validated on backend
- **No secrets in frontend** — .env variables never exposed
- **.gitignore** — .env is never committed to git

---

## 🛠️ Tech Stack

| Layer    | Technology           |
|----------|----------------------|
| Frontend | HTML, CSS, Vanilla JS |
| Backend  | Node.js + Express    |
| Email    | Nodemailer (Gmail)   |
| Deploy   | Vercel / Railway     |

---

Built with ❤️ for AK Event Planners
