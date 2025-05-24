# Domain Monitoring Feature

## Overview
Domain Monitoring feature ช่วยให้คุณสามารถติดตามวันหมดอายุของ domain names ต่าง ๆ ได้ในแดชบอร์ดเดียวกัน

## Features

### 🌐 Domain Expiry Monitoring
- ตรวจสอบวันหมดอายุของ domain
- แสดงจำนวนวันที่เหลือก่อนหมดอายุ
- แจ้งเตือนเมื่อ domain ใกล้หมดอายุ (ภายใน 30 วัน)
- แสดงสถานะ domain ที่หมดอายุแล้ว

### 📊 Dashboard Integration
- แสดงสถิติ domain ใน dashboard หลัก
- Stats cards แสดง:
  - จำนวน domain ทั้งหมด
  - จำนวน domain ที่ยังใช้งานได้
  - จำนวน domain ที่ใกล้หมดอายุ
  - จำนวน domain ที่หมดอายุแล้ว

### 🔄 Auto-refresh
- อัปเดตข้อมูล domain อัตโนมัติทุก 5 นาที
- สามารถ refresh ด้วยตนเองได้

### ➕ Domain Management
- เพิ่ม domain ใหม่ได้ง่าย ๆ
- ลบ domain ที่ไม่ต้องการออกได้
- ป้องกันการเพิ่ม domain ซ้ำ

## Components

### 1. DomainMonitor Component
- Component หลักสำหรับแสดงผล domain monitoring
- ใช้ Accordion UI pattern เพื่อประหยัดพื้นที่
- แสดงรายการ domain พร้อมสถานะและวันหมดอายุ

### 2. useDomainMonitoring Hook
- Custom hook สำหรับจัดการ state และ logic ของ domain monitoring
- รองรับ auto-refresh และ error handling
- สามารถ reuse ได้ในหลาย components

## API Endpoints

### Backend (NestJS)
```
GET /api/domain/check/:domain
- ตรวจสอบ domain เดียว

GET /api/domain/check-multiple?domains=domain1.com,domain2.com
- ตรวจสอบหลาย domains พร้อมกัน
```

### Domain Service
- ใช้ `whois` library สำหรับดึงข้อมูล domain
- Parse วันหมดอายุจาก whois data
- คำนวณจำนวนวันที่เหลือ

## Usage

### ใน Dashboard
Domain monitoring จะแสดงอัตโนมัติใน dashboard หลัก:

1. **Stats Cards**: แสดงสถิติ domain ด้านบน
2. **Domain Monitor Section**: แสดงรายละเอียด domain ด้านล่าง

### การเพิ่ม Domain ใหม่
1. คลิกที่ Domain Monitoring section เพื่อขยาย
2. พิมพ์ชื่อ domain ในช่อง "Add Domain"
3. กด Enter หรือคลิกปุ่ม "Add"

### การลบ Domain
1. คลิกไอคอน delete (🗑️) ที่มุมขวาบนของ domain card

## Status Indicators

### 🟢 Valid (สีเขียว)
- Domain ยังใช้งานได้และไม่ใกล้หมดอายุ

### 🟡 Expiring Soon (สีเหลือง)
- Domain ใกล้หมดอายุภายใน 30 วัน

### 🔴 Expired (สีแดง)
- Domain หมดอายุแล้ว

### ❌ Error (สีแดง)
- ไม่สามารถดึงข้อมูล domain ได้ (อาจเป็น domain ที่ไม่มีอยู่จริง)

## Configuration

### Default Domains
ระบบจะ monitor domains เริ่มต้นเหล่านี้:
- google.com
- github.com
- stackoverflow.com

### Refresh Interval
- Auto-refresh: ทุก 5 นาที (300,000 ms)
- สามารถปรับได้ใน `useDomainMonitoring` hook

## Technical Details

### Frontend Stack
- React + TypeScript
- Material-UI components
- Custom hooks pattern
- Axios for API calls

### Backend Stack
- NestJS
- whois library
- TypeScript

### Data Flow
1. Frontend เรียก API `/api/domain/check-multiple`
2. Backend ใช้ whois library ดึงข้อมูล
3. Parse วันหมดอายุและคำนวณวันที่เหลือ
4. ส่งข้อมูลกลับไปยัง Frontend
5. Frontend แสดงผลและอัปเดต stats

## Future Enhancements

### 🔔 Notifications
- Email alerts เมื่อ domain ใกล้หมดอายุ
- Line/Discord notifications
- Push notifications

### 💾 Persistence
- บันทึก domain list ใน database
- User-specific domain monitoring
- History tracking

### 📈 Analytics
- Domain expiry trends
- Renewal reminders
- Cost tracking

### 🔍 Advanced Features
- SSL certificate monitoring integration
- Subdomain monitoring
- Bulk domain import/export 