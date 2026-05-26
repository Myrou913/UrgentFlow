# UrgentFlow 🏥

> Smart healthcare access platform for Tunisia — book appointments, manage queues, and request emergency help in real time.

![UrgentFlow](myProj/src/assets/logo11.png)

---

## 🌟 Overview

UrgentFlow is a full-stack web application that connects patients with hospitals, clinics, and pharmacies across Tunisia. It reduces waiting time, simplifies appointment booking, and provides instant emergency routing — all in one place.

---

## ✨ Features

### For Patients
- 🔍 **Find nearby hospitals** — GPS-based search with distance sorting
- 📅 **Book appointments** — Real-time queue management with turn number and estimated wait time
- 🚨 **Emergency requests** — One-click emergency button that sends your exact GPS location to the admin
- 📱 **SMS & Email notifications** — Receive your queue number and reminders via SMS (Vonage) or email
- 👤 **Profile management** — Update personal and medical info, upload a profile photo
- 🌍 **Multi-language** — Full support for English, French, and Arabic
- 📋 **Appointment history** — Track all past and upcoming visits

### For Admins
- 🏥 **Service-scoped dashboards** — Each admin sees only their service (Cardiology, Emergency, etc.)
- 📊 **Patient queue management** — Update appointment status, schedule follow-ups
- 🗂️ **Archives** — Full history of completed and cancelled appointments
- 🚑 **Emergency dashboard** — View patient GPS location, get directions, mark cases as resolved

### For Super Admin
- 📈 **Feedback intelligence** — Sentiment analysis on patient feedback with smart recommendations
- 🔁 **Most repeated comments** — Identify recurring issues automatically
- 📊 **Rating breakdown** — Weekly sentiment trends

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| Styling | CSS Modules, custom design system |
| Backend | Node.js, Express |
| Database | MySQL (via XAMPP) |
| Auth | bcrypt, localStorage sessions |
| SMS | Vonage API |
| Email | Nodemailer (Gmail) |
| Maps | OpenStreetMap (Overpass API) |
| Icons | FontAwesome |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- XAMPP with MySQL running on port 3307
- A Vonage account (for SMS)
- A Gmail account with App Password (for email)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/urgentflow.git
cd urgentflow
```

### 2. Install frontend dependencies
```bash
cd myProj
npm install
```

### 3. Install backend dependencies
```bash
cd src/backend
npm install
```

### 4. Configure environment variables
```bash
cp src/backend/.env.example src/backend/.env
# Fill in your credentials in .env
```

### 5. Set up the database
- Start XAMPP and make sure MySQL is running on port 3307
- Create a database named `urgentflow`
- Import `DataBase.sql` via phpMyAdmin
- Run the admin seed script:
```bash
cd src/backend
node seedAdmins.js
```

### 6. Start the backend
```bash
cd src/backend
node server.js
```

### 7. Start the frontend
```bash
cd myProj
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 👥 Default Accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@urgentflow.com | SuperAdmin123! |
| Emergency Admin | admin.emergency@urgentflow.com | Admin123! |
| Cardiology Admin | admin.cardiology@urgentflow.com | Admin123! |
| Patient | Sign up normally | — |

> ⚠️ Change all default passwords after first login.

---

## 📁 Project Structure

```
urgentflow/
├── myProj/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── context/         # Language context & translations
│   │   ├── utils/           # Auth, appointments helpers
│   │   ├── assets/          # Images
│   │   └── backend/         # Node.js + Express API
│   │       ├── controllers/ # Route handlers
│   │       ├── models/      # DB models
│   │       ├── routes/      # API routes
│   │       └── server.js    # Entry point
├── DataBase.sql             # Database schema & seed data
└── README.md
```

---

## 🔒 Security Notes

- Admin accounts are created via `seedAdmins.js` only — not through the signup form
- Roles and service scopes are stored in the database, never derived from email patterns
- Passwords are hashed with bcrypt (10 rounds)
- The `.env` file is gitignored — never commit real credentials

---

## 📸 Screenshots

> Add screenshots of the landing page, hospitals page, booking form, admin dashboard, and super admin feedback page here.

---

## 🤝 Contributing

This project was built as a federated academic project. Contributions, issues, and feature requests are welcome.

---

## 📄 License

MIT License — feel free to use and adapt.

---

*Built with ❤️ for better healthcare access in Tunisia.*
