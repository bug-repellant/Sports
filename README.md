# 🏆 Gameopedia Sports Club & Signup Portal

A modern, full-stack, real-time sports registration and event management web application custom-built for **Gameopedia** employees.

---

## ⚡ Key Highlights & Requirements Fulfilled

| Requirement | Implementation |
|---|---|
| **Domain Restriction** | Strictly locked to `@gameopedia.com` email addresses. Any external domain (`@gmail.com`, etc.) is blocked with instant UI feedback and HTTP 403 API protection. |
| **Weekly Window** | Signups are available **strictly for the subsequent calendar week** (Monday – Sunday) with a live countdown timer until the Sunday 11:59 PM cutoff. |
| **Sports Covered (7 Sports)** | 🏀 **Basketball**, ⚽ **Football**, 🏏 **Cricket**, 🏸 **Badminton**, 🎾 **Squash**, 🏓 **Pickleball**, 🏐 **Volleyball**. |
| **Unlimited Slots** | **No slot caps.** Any number of colleagues can sign up. Live participant rosters show all registered players with department tags and timestamps. |
| **Interactive Dashboards** | Filter by day and sport, live avatar stacks, instant 1-click Join/Leave with celebration confetti, **Smart Team Randomizer** (splits players into Team Red vs Blue with 1-click shuffle), and **"My Signups"** personal schedule with **Google Calendar** and **`.ics`** exports. |
| **Admin Portal** | Admins can schedule or update **venues**, **start/end timings**, court notes, footwear/gear rules, and game status (`Venue Confirmed`, `Registration Open`, `Completed`). Real-time **attendance check-in** on game days and **office broadcast banners**. |
| **Google Sheets Integration** | Live bidirectional sync via **Google Apps Script Webhooks**, manual "Sync Now" button with audit logs, copyable Apps Script template, and 1-click **CSV/Excel Export**. |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)

### 1. Launch the Application
From the project root:
```bash
# Start the unified backend & frontend server on http://localhost:5000
npm start
```

Or run frontend in development mode with Vite hot-reloading:
```bash
# Terminal 1: Backend API & WebSocket Server
npm run server

# Terminal 2: Vite React Frontend (port 3000)
npm run client
```

Open your browser to:
👉 **`http://localhost:5000`** (or `http://localhost:3000` in dev mode)

---

## 👥 Built-In Personas for Demo & Testing

Use the top-right persona switcher to test the application instantly:

| Name | Email | Department | Role |
|---|---|---|---|
| **Aravind Swaminathan** | `aravind@gameopedia.com` | Engineering | 🏆 Sports Admin |
| **Sarah Jenkins** | `sarah.jenkins@gameopedia.com` | Game Indexing & Research | ⚡ Active Player |
| **Marcus Chen** | `marcus.chen@gameopedia.com` | Game Engine Architecture | ⚡ Active Player |
| **Priya Sharma** | `priya.sharma@gameopedia.com` | Product Strategy | ⚡ Active Player |
| **Alex Rodriguez** | `alex.rodriguez@gameopedia.com` | QA & Playtesting | ⚡ Active Player |
| **Elena Rostova** | `elena.rostova@gameopedia.com` | UI/UX Design | ⚡ Active Player |
| **David Miller** | `david.miller@gameopedia.com` | People Operations | 🏆 Sports Admin |

*You can also log in with any custom `@gameopedia.com` email address.*

---

## 📊 Connecting to Google Sheets for Live Tracking

1. Open your target Google Sheet.
2. Navigate to **Extensions** > **Apps Script**.
3. In the Gameopedia Admin Portal (or the **"Sheets Sync"** button in Navbar), click **"View Apps Script Guide"** and copy the script code.
4. Paste the script into `Code.gs` in Google Sheets.
5. Click **Deploy** > **New Deployment** > Select **Web App** (Execute as: *Me*, Who has access: *Anyone*).
6. Copy the resulting Web App URL and paste it into the **Admin Portal** under Google Sheets Sync settings.
7. Every signup, cancellation, or admin change will automatically push to Google Sheets in real-time!

---

## 🧪 Automated Verification & Testing

Run the end-to-end automated test suite:
```bash
npm test
```

Verifies:
- `@gameopedia.com` domain enforcement (rejection of non-gameopedia emails with 403).
- Subsequent week rolling schedule generation.
- Unlimited player signup and cancellation.
- Admin venue and timings update dispatch.
- Google Sheets webhook live sync.
- CSV export generation.
- Single-page application static file hosting.
