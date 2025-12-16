
# Real-Time Chat

A modern **real-time chat application** built with **React (Vite)** for the frontend and **Node.js + Express** for the backend. Supports user authentication, OTP verification via email, and responsive UI.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Setup & Installation](#setup--installation)
* [Environment Variables](#environment-variables)
* [Running the Project](#running-the-project)
* [Folder Structure](#folder-structure)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **User Authentication**: Register/Login with email verification (OTP).
* **OTP Verification**: Sends 6-digit OTP to Gmail; valid for 5 minutes.
* **Real-Time Messaging**: Supports 1-to-1 and group chat (Socket.io).
* **Responsive UI**: Built with Tailwind CSS and modern design.
* **Password Toggle**: Show/hide password fields.
* **ReCAPTCHA**: Protect registration from bots.
* **Role-Based Access**: Admin vs User (planned).

---

## Tech Stack

**Frontend:**

* React + Vite
* Tailwind CSS
* React Router DOM
* ReCAPTCHA

**Backend:**

* Node.js + Express
* MongoDB + Mongoose
* JWT Authentication
* Bcrypt for password hashing
* Nodemailer for OTP emails

---

## Setup & Installation

### Clone the repository

```bash
git clone https://github.com/lethanhdo1704/real_time_chat.git
cd real_time_chat
```

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file if needed for API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Project

### Backend

```bash
cd backend
npm run dev
```

The server will run at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm run dev
```

The frontend will run at `http://localhost:5173` (Vite default).

---

## Folder Structure

```
real_time_chat/
│
├─ backend/
│   ├─ models/        # MongoDB schemas (User, OTP)
│   ├─ routes/        # API routes (auth, otp)
│   ├─ utils/         # Helper functions (email, validation)
│   ├─ server.js      # Entry point
│   └─ .env
│
├─ frontend/
│   ├─ src/
│   │   ├─ components/  # Reusable React components
│   │   ├─ pages/       # Login, Register, Chat pages
│   │   ├─ context/     # React Context for auth
│   │   └─ styles/      # CSS files
│   └─ vite.config.js
│
└─ README.md
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

This project is **MIT Licensed**.