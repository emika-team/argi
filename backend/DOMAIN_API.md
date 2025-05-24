# Domain API Documentation

## Overview

ระบบจัดการ domain ได้รับการปรับปรุงให้ใช้ MongoDB database แทนการเก็บข้อมูลใน memory ระบบใหม่มี features เพิ่มเติม เช่น การเก็บ metadata, alert settings, และการติดตามสถานะ domain

## Database Schema

### Domain Model

```typescript
{
  domain: string;           // ชื่อ domain (required)
  userId: ObjectId;         // ID ของ user (required)
  isActive: boolean;        // สถานะการใช้งาน (default: true)
  description?: string;     // คำอธิบาย domain
  tags?: string[];          // tag สำหรับจัดหมวดหมู่
  lastCheckedAt?: Date;     // วันที่เช็คล่าสุด
  lastExpiryDate?: Date;    // วันหมดอายุล่าสุด
  lastDaysUntilExpiry?: number; // จำนวนวันก่อนหมดอายุ
  lastError?: string;       // error ล่าสุด
  isExpired: boolean;       // สถานะหมดอายุ
  isExpiringSoon: boolean;  // สถานะใกล้หมดอายุ
  enableExpiryAlerts: boolean; // เปิด/ปิด alert
  alertDaysBefore: number;  // จำนวนวันก่อนหมดอายุที่จะ alert
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Legacy Endpoints (Backward Compatibility)

#### GET `/domain/list/:userId`
ดึงรายการ domain ของ user (แบบง่าย)

#### POST `/domain/add`
เพิ่ม domain ใหม่ (แบบง่าย)
```json
{
  "domain": "example.com",
  "userId": "user123"
}
```

#### DELETE `/domain/:userId/:domain`
ลบ domain

#### GET `/domain/list-with-status/:userId`
ดึงรายการ domain พร้อมสถานะ

### New Enhanced Endpoints

#### GET `/domain/user/:userId/domains`
ดึงรายการ domain ทั้งหมดพร้อม metadata

**Response:**
```json
[
  {
    "_id": "...",
    "domain": "example.com",
    "userId": "user123",
    "description": "My website",
    "tags": ["production", "important"],
    "isActive": true,
    "enableExpiryAlerts": true,
    "alertDaysBefore": 30,
    "lastCheckedAt": "2024-01-01T00:00:00Z",
    "lastExpiryDate": "2024-12-31T00:00:00Z",
    "lastDaysUntilExpiry": 365,
    "isExpired": false,
    "isExpiringSoon": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/domain/user/:userId/domains`
เพิ่ม domain ใหม่พร้อม options

**Request Body:**
```json
{
  "domain": "example.com",
  "description": "My website",
  "tags": ["production", "important"],
  "enableExpiryAlerts": true,
  "alertDaysBefore": 30
}
```

#### PUT `/domain/user/:userId/domains/:domain`
อัปเดต domain settings

**Request Body:**
```json
{
  "description": "Updated description",
  "tags": ["production", "critical"],
  "isActive": true,
  "enableExpiryAlerts": false,
  "alertDaysBefore": 15
}
```

#### DELETE `/domain/user/:userId/domains/:domain`
ลบ domain

#### GET `/domain/user/:userId/domains/:domain/check`
เช็คสถานะ domain และอัปเดตข้อมูลในฐานข้อมูล

#### GET `/domain/expiring?days=30`
ดึงรายการ domain ที่กำลังจะหมดอายุ

**Query Parameters:**
- `days` (optional): จำนวนวันก่อนหมดอายุ (default: 30)

### Domain Check Endpoints

#### GET `/domain/check/:domain`
เช็คสถานะ domain เดียว

#### GET `/domain/check-multiple?domains=google.com,github.com`
เช็คสถานะหลาย domain

## Migration

### รันการ Migration

```bash
npm run migrate-domains
```

Script นี้จะ:
1. สร้าง default user (admin@example.com) ถ้ายังไม่มี
2. เพิ่ม default domains สำหรับทดสอบ

### Environment Variables

ตรวจสอบให้แน่ใจว่ามี environment variables เหล่านี้:

```env
MONGODB_URI=mongodb://localhost:27017/uptime-monitor
JWT_SECRET=your-jwt-secret
```

## Usage Examples

### เพิ่ม Domain ใหม่

```javascript
const response = await fetch('/domain/user/user123/domains', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'mysite.com',
    description: 'My personal website',
    tags: ['personal', 'blog'],
    enableExpiryAlerts: true,
    alertDaysBefore: 14
  })
});
```

### อัปเดต Domain Settings

```javascript
const response = await fetch('/domain/user/user123/domains/mysite.com', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Updated description',
    alertDaysBefore: 7
  })
});
```

### ดึง Domain ที่กำลังจะหมดอายุ

```javascript
const response = await fetch('/domain/expiring?days=7');
const expiringDomains = await response.json();
```

## Error Handling

- `ConflictException`: Domain already exists
- `NotFoundException`: Domain not found
- `ValidationException`: Invalid input data

## Notes

- ชื่อ domain จะถูกแปลงเป็นตัวพิมพ์เล็กอัตโนมัติ
- มี unique constraint สำหรับ userId + domain
- Legacy endpoints ยังคงใช้งานได้เพื่อ backward compatibility
- สามารถเพิ่ม authentication middleware ได้ในอนาคต 