# DriveOps

DriveOps is a full-stack fleet management web application built to help organizations manage vehicles, drivers, trips, maintenance operations, and fuel expenses in one place.

The project uses a React + Vite frontend and a Node.js + Express + MongoDB backend, with JWT-based authentication and role-based access control for different fleet stakeholders.

## Overview

DriveOps is designed for fleet operations teams that need to:

- Track and manage vehicle records
- Manage driver profiles and licence status
- Create and monitor trip workflows
- Schedule and close maintenance work
- Record fuel usage and related operational expenses
- View a dashboard with real-time fleet status summaries

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Lucide React icons

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- RBAC authentication


## Core Features

- User registration and login with role-aware access
- Protected routes for authenticated users only
- Fleet dashboard with summary metrics and recent trip activity
- Vehicle management with status tracking
- Driver management with licence and safety data
- Trip lifecycle management:
  - Draft
  - Dispatched
  - Completed
  - Cancelled
- Maintenance workflow linked to vehicle availability
- Fuel logs, expenses, and vehicle operational cost reporting

## Role-Based Access

The system supports these user roles:

- fleet_manager
- driver
- safety_officer
- financial_analyst

Each module uses role checks to control who can create, update, or delete records.

## Project Structure

```text
DriveOps/
├── client/              # React frontend
│   ├── src/             # Application pages, components, context, API utilities
│   └── package.json     # Frontend dependencies and scripts
├── server/              # Express backend
│   ├── controllers/     # Request handlers for each domain
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth and role middleware
│   ├── config/          # Database setup
│   └── package.json     # Backend dependencies and scripts
└── README.md            # Project documentation
```

## Environment Variables

Create a `.env` file inside the `server` folder with the following values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## Getting Started

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Install frontend dependencies

```bash
cd ../client
npm install
```

### 3. Start the backend

```bash
cd server
npm run dev
```

The API will run on:

- http://localhost:5000

### 4. Start the frontend

```bash
cd client
npm run dev
```

The frontend development server will run on:

- http://localhost:5173

## Available Scripts

### Backend

```bash
npm run dev   # Start with nodemon
npm start     # Start production server
```

### Frontend

```bash
npm run dev   # Start Vite dev server
npm run build # Build production bundle
npm run preview # Preview production build locally
npm run lint   # Run ESLint checks
```

## API Highlights

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Vehicles
- GET /api/vehicles
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Drivers
- GET /api/drivers
- POST /api/drivers
- PUT /api/drivers/:id
- DELETE /api/drivers/:id

### Trips
- GET /api/trips
- POST /api/trips
- PUT /api/trips/:id/dispatch
- PUT /api/trips/:id/complete
- PUT /api/trips/:id/cancel

### Maintenance
- GET /api/maintenance
- POST /api/maintenance
- PUT /api/maintenance/:id
- PUT /api/maintenance/:id/close
- DELETE /api/maintenance/:id

### Fuel and Expenses
- GET /api/fuel/logs
- POST /api/fuel/logs
- DELETE /api/fuel/logs/:id
- GET /api/fuel/expenses
- POST /api/fuel/expenses
- DELETE /api/fuel/expenses/:id
- GET /api/fuel/cost/:vehicleId

## Business Rules

The application includes several operational checks to keep fleet data consistent:

- A vehicle cannot be deleted when it is on an active trip
- A driver cannot be assigned if they are suspended or their licence has expired
- A trip cannot exceed the selected vehicle's maximum load capacity
- Creating an active maintenance record automatically places the vehicle in shop status
- Closing maintenance restores the vehicle to available status unless it has been retired

## Notes

- The frontend is protected with authenticated routing and stores JWT details in local storage.
- The backend connects to MongoDB through the `MONGO_URI` environment variable.
- The repository already includes the main application structure for a managed fleet operations workflow.

## License

This project is currently distributed under the ISC license defined in the backend package configuration.
