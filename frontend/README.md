# Uptime Monitor Frontend

React TypeScript application สำหรับ Uptime Monitor System

## 🚀 Features

- **Modern UI**: Material-UI components และ responsive design
- **Authentication**: Login/Register forms พร้อม JWT handling
- **Dashboard**: ภาพรวมสถานะ monitors และสถิติ
- **Monitor Management**: CRUD operations สำหรับจัดการ monitors
- **Real-time Updates**: Auto-refresh และ WebSocket support

## 🛠️ Tech Stack

- **React 18** - Frontend framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI component library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Chart.js** - Charts and graphs

## 📦 Installation

```bash
npm install
```

## 🚀 Development

```bash
npm start
```

แอปจะเปิดที่ [http://localhost:3000](http://localhost:3000)

## 🏗️ Build

```bash
npm run build
```

## 🧪 Testing

```bash
npm test
```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Navbar.tsx
│   ├── StatusChip.tsx
│   ├── LoadingSpinner.tsx
│   └── MonitorCard.tsx
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── Monitors.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── hooks/               # Custom React hooks
│   └── useAuth.ts
├── services/            # API services
│   └── api.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── formatters.ts
├── App.tsx             # Main app component
└── index.tsx           # App entry point
```

## 🔧 Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ frontend:

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000
```

## 📱 Pages & Features

### Login/Register
- User authentication forms
- Input validation
- Error handling
- Automatic redirect

### Dashboard
- Monitor statistics overview
- Status cards
- Recent activity
- Real-time updates

### Monitors
- Monitor list with status
- Add/Edit monitor dialog
- Delete confirmation
- Search and filtering

## 🎨 UI Components

### StatusChip
แสดงสถานะของ monitor พร้อมไอคอนและสี

### MonitorCard
Card component สำหรับแสดงข้อมูล monitor

### LoadingSpinner
Loading indicator พร้อมข้อความ

## 🔌 API Integration

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- GET `/auth/profile`

### Monitors
- GET `/monitors`
- POST `/monitors`
- PATCH `/monitors/:id`
- DELETE `/monitors/:id`
- GET `/monitors/:id/stats`

### Dashboard
- GET `/dashboard`

## 📊 State Management

ใช้ React hooks สำหรับ state management:
- `useState` - Local component state
- `useEffect` - Side effects
- Custom hooks เช่น `useAuth`

## 🔐 Authentication Flow

1. User login ผ่าน login form
2. JWT token ถูกเก็บใน localStorage
3. Token ส่งไปกับทุก API request
4. Auto-redirect หาก token หมดอายุ

## 🚧 TODO

- [ ] Real-time WebSocket updates
- [ ] Charts และ graphs
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive improvements
- [ ] Notification system
- [ ] Advanced filtering
- [ ] Export functionality 