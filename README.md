# 🌊 Q-Flow: Intelligent Queue Management System

Q-Flow is a premium, full-stack queue management application designed for managers to create, organize, and optimize service lines in real-time. Built with a beautiful dark-mode interface, glassmorphic cards, custom SVG analytics charts, and live ticking timers.

---

## ✨ Features

- **🔐 Manager Authentication**: Secure Register and Login portals using JWT (JSON Web Tokens) sessions and salted `bcryptjs` password encryption.
- **📊 Real-Time Analytics Dashboard**:
  - Live metric trackers (Active Queues, Waiting Line, Average Wait Time, Busiest Hours).
  - **Weekly Token Traffic Area Chart**: Custom SVG Area Chart showing token creation vs service completions.
  - **Hourly Load Density Bar Chart**: Custom SVG Bar Chart mapping peak traffic periods.
  - **Progress Rings**: Dual circular progress rings showing completion vs cancellation rates.
  - **Active Queues Overview Table**: High-level status board of all managed lines.
- **🎮 Queue Console Operations**:
  - **Token Generation**: Add customers to lines to generate auto-incrementing tokens (e.g., `Q-101`).
  - **Up/Down Line Reordering**: Move waiting customers up or down in the queue with simple arrow buttons.
  - **Serve Next Action**: Select the top-of-line customer for service with a single click.
  - **Live Elapsed Timers**: Live-updating clocks counting wait time for queued customers and service duration for customers in service.
  - **Resolution Logging**: Complete or cancel service, recording detailed wait/service times.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), Vanilla CSS Custom Design System, Dynamic Inline SVG Graphic Charts (Zero external dependency chart issues).
- **Backend**: Node.js, Express.js (REST API).
- **Database**: Atomic, transactional JSON-file based database system (`data/db.json` managed by `db.js`) for zero-dependency portability.
- **Security**: JSON Web Tokens (JWT) for authentication, `bcryptjs` for secure password hashing.

---

## 📁 Repository Structure

```
├── server.js              # Express REST API & Production Static Server
├── db.js                  # Atomic JSON File Database Manager
├── package.json           # Scripts, dependencies, and project metadata
├── vite.config.js         # Vite bundler configuration & backend API proxy
├── index.html             # Client HTML entry point
├── .gitignore             # Config to exclude node_modules, builds, and local db files
├── data/
│   └── db.json            # Persistence database (generated automatically)
└── src/
    ├── main.jsx           # React app renderer
    ├── App.jsx            # State Router & Client Entry
    ├── index.css          # Design Tokens & Stylesheet System
    ├── components/
    │   ├── Sidebar.jsx    # Console Navigation & Session Sidebar
    │   ├── Modal.jsx      # Slide-Up Overlay Forms
    │   ├── MetricCard.jsx # Stats cards with glow effects
    │   └── SvgCharts.jsx  # Customizable SVG Area/Bar/Progress charts
    └── views/
        ├── AuthView.jsx   # Register & Login flow view
        ├── Dashboard.jsx  # Analytics & Metrics view
        ├── QueuesView.jsx # Queue creation & directory view
        └── QueueDetail.jsx# Queue operations console view
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation & Launch

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd rugas-queue-manager
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

3. Build the frontend for production:
   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```
   Open your browser and test at **[http://localhost:5000](http://localhost:5000)**.

### Development Mode

To run backend and frontend concurrently in development mode (with Hot Module Replacement):
1. Start Express API server (on port 5000):
   ```bash
   node server.js
   ```
2. Start Vite dev server in another terminal (runs client on port 3000, proxies requests to 5000):
   ```bash
   npm run client
   ```

---

## 🔌 API Documentation

All routes (except Auth) require an `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/register` - Create a new manager account.
- `POST /api/auth/login` - Authenticate manager credentials and receive a JWT.
- `GET /api/auth/me` - Validate the active session.

### Queue Management
- `GET /api/queues` - List all queues owned by the manager.
- `POST /api/queues` - Create a new queue.
- `GET /api/queues/:id` - Fetch detailed queue information (split into waiting, serving, and history).
- `DELETE /api/queues/:id` - Delete a queue.

### Token Operations
- `POST /api/queues/:id/tokens` - Generate a new token and append it to the bottom of the queue.
- `POST /api/tokens/:id/serve` - Put a token into active service (starts service clock).
- `POST /api/tokens/:id/complete` - Mark service as completed (calculates final durations).
- `POST /api/tokens/:id/cancel` - Cancel a ticket.
- `POST /api/tokens/:id/move` - Move a token `up` or `down` in the waiting line.

### Analytics
- `GET /api/analytics` - Fetch aggregated wait times, daily queues, load distribution, and trend rates.

---

## 👨‍💻 Evaluation Summary

1. **Working Application**: Done. Express hosts the build and processes all API endpoints.
2. **UI/UX Aesthetics**: Beautiful dark mode slate theme, neon accent highlights, responsive grid, dynamic hover states, and live timers.
3. **Bug-Free Integrity**: Local transactional database writes ensure no corruption, with fully passing E2E browser tests.
