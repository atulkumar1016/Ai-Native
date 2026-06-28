# AI-Native Test Automation Platform

A complete, full-stack AI-Native Test Automation Platform built from scratch. It features user authentication, project workspaces, test cases manager (manual, REST API tests, and Playwright browser tests), AI-assisted test suite generation, Playwright runner integrations, AI bug diagnostic analyzer, automated reports compiler (PDF, CSV), and an administrator accounts console.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS, React Router v6, Axios, Chart.js, Lucide Icons
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Playwright Test runner, PDFKit
- **AI**: Gemini API (`gemini-1.5-flash` model, modular provider design with mockup fallbacks)

---

## 📂 Project Structure
```
├── /backend
│   ├── /config          # DB Connection setup
│   ├── /models          # User, Project, TestCase, TestExecution schemas
│   ├── /middleware      # Protect and Admin JWT validators, Error interceptor
│   ├── /validators      # Joi validation schemas
│   ├── /services        # Gemini AI & Playwright runner scripts
│   ├── /utils           # PDF & CSV generation reports helper
│   ├── /scripts         # Seed script data
│   ├── server.js        # Express app entry
│   └── package.json     # Backend configuration
│
├── /frontend
│   ├── /src
│   │   ├── /components  # Layout, StatCard, Reusable charts
│   │   ├── /context     # AuthContext state manager
│   │   ├── /api         # Axios api client interceptor
│   │   ├── /pages       # Dashboard, Login, AIGenerator, APITester, AdminPanel, etc.
│   │   ├── main.jsx     # Vite boot loader
│   │   └── App.jsx      # Router mapping
│   ├── package.json     # Frontend configuration
│   └── tailwind.config.js
```

---

## 🚀 Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and [MongoDB](https://www.mongodb.com/) running locally.

### 1. Setup Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment configuration:
   Create a `.env` file (you can copy `.env.example`) and fill in details:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/ai_native_test_platform
   JWT_SECRET=super_secret_jwt_token_key_12345
   GEMINI_API_KEY=your_google_studio_gemini_api_key_here
   ```
4. Install Playwright browser engine binaries:
   ```bash
   npx playwright install chromium
   ```
5. Seed database with test accounts and dummy charts histories:
   ```bash
   npm run seed
   ```
6. Launch backend server in development mode:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5000`)*

### 2. Setup Frontend
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch frontend dev server:
   ```bash
   npm run dev
   ```
   *(Running on `http://localhost:5173` with proxy forwarding `/api` to port 5000)*

---

## 🔑 Login Accounts (Default Seed)
- **Regular QA Engineer**:
  - Email: `user@test.com`
  - Password: `password123`
- **QA Manager (Admin)**:
  - Email: `admin@test.com`
  - Password: `password123`
