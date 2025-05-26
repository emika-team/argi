# Guard Routes Documentation

## ภาพรวม
Guard Routes เป็นระบบป้องกัน routes ที่ช่วยจัดการการเข้าถึงหน้าต่างๆ ในแอปพลิเคชัน

## Components

### 1. ProtectedRoute
Component หลักสำหรับป้องกัน routes ตาม authentication status

#### Props:
- `children`: React.ReactNode - เนื้อหาที่จะแสดง
- `requireAuth`: boolean (default: true) - ต้องการ authentication หรือไม่
- `redirectTo`: string - path ที่จะ redirect ไป

#### ตัวอย่างการใช้งาน:

```tsx
// Protected route - ต้องการ authentication
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Public route - ไม่ต้องการ authentication
<Route 
  path="/login" 
  element={
    <ProtectedRoute requireAuth={false}>
      <Login />
    </ProtectedRoute>
  } 
/>
```

### 2. RoleGuard
Component สำหรับจัดการ role-based access control

#### Props:
- `children`: React.ReactNode - เนื้อหาที่จะแสดง
- `allowedRoles`: string[] - roles ที่อนุญาตให้เข้าถึง
- `fallbackPath`: string (default: '/dashboard') - path ที่จะ redirect เมื่อไม่มีสิทธิ์
- `showUnauthorized`: boolean (default: false) - แสดงหน้าแจ้งเตือนแทนการ redirect

#### ตัวอย่างการใช้งาน:

```tsx
// Admin only
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <RoleGuard allowedRoles={['admin']} showUnauthorized={true}>
        <AdminPanel />
      </RoleGuard>
    </ProtectedRoute>
  } 
/>

// Multiple roles
<Route 
  path="/monitors" 
  element={
    <ProtectedRoute>
      <RoleGuard allowedRoles={['admin', 'user', 'moderator']}>
        <Monitors />
      </RoleGuard>
    </ProtectedRoute>
  } 
/>
```

## คุณสมบัติ

### ✅ Authentication Guard
- ตรวจสอบสถานะการ login
- Redirect ไปหน้า login เมื่อไม่ได้ login
- Redirect กลับหน้าเดิมหลัง login สำเร็จ

### ✅ Role-based Access Control
- ตรวจสอบ role ของผู้ใช้
- รองรับหลาย roles
- Admin มีสิทธิ์เข้าถึงทุกหน้า

### ✅ Loading States
- แสดง loading ขณะตรวจสอบ authentication
- ป้องกัน flashing ของเนื้อหา

### ✅ Redirect Handling
- เก็บ location ที่ผู้ใช้พยายามเข้าถึง
- Redirect กลับหน้าเดิมหลัง login

### ✅ Error Handling
- แสดงหน้าแจ้งเตือนเมื่อไม่มีสิทธิ์
- Fallback paths ที่กำหนดได้

## การติดตั้งและใช้งาน

1. นำเข้า components ที่ต้องการ:
```tsx
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
```

2. ใช้ใน routing:
```tsx
<Routes>
  <Route 
    path="/dashboard" 
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } 
  />
</Routes>
```

## Best Practices

1. **ใช้ ProtectedRoute เป็นชั้นแรก** สำหรับตรวจสอบ authentication
2. **ใช้ RoleGuard เป็นชั้นที่สอง** สำหรับตรวจสอบ permissions
3. **กำหนด fallbackPath** ที่เหมาะสมสำหรับแต่ละหน้า
4. **ใช้ showUnauthorized={true}** สำหรับหน้าที่ต้องการแจ้งเตือนผู้ใช้
5. **Admin role** ควรมีสิทธิ์เข้าถึงทุกหน้าโดยอัตโนมัติ 