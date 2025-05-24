# 🚀 การติดตั้งและใช้งานระบบ Uptime Monitor

## 📋 ข้อกำหนดของระบบ

- Docker และ Docker Compose
- Git
- Port 3000 (Frontend), 8000 (Backend), 80 (Nginx)

## 🛠️ การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd uptime-monitor
```

### 2. ตั้งค่า Environment Variables
```bash
cp env.example .env
```

แก้ไขไฟล์ `.env` ตามความต้องการ:
```env
# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/monitor_db?authSource=admin
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (สำหรับการแจ้งเตือน)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. รันด้วย Docker Compose
```bash
# รันในโหมด development
docker-compose up -d

# ดู logs
docker-compose logs -f

# หยุดระบบ
docker-compose down
```

## 🌐 การเข้าใช้งาน

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **API Documentation**: http://localhost:8000/api/docs
- **Nginx Proxy**: http://localhost

## 👤 การสร้างบัญชีผู้ใช้

1. เข้าไปที่ http://localhost:3000
2. คลิก "Register" เพื่อสร้างบัญชีใหม่
3. กรอกข้อมูล: อีเมล, รหัสผ่าน, ชื่อ, นามสกุล
4. เข้าสู่ระบบด้วยบัญชีที่สร้าง

## 📊 การใช้งานระบบ

### การเพิ่มเว็บไซต์ที่ต้องการตรวจสอบ

1. ไปที่หน้า "Monitors"
2. คลิก "Add New Monitor"
3. กรอกข้อมูล:
   - **Name**: ชื่อของเว็บไซต์
   - **URL**: URL ที่ต้องการตรวจสอบ
   - **Type**: ประเภทการตรวจสอบ (HTTP/HTTPS/PING)
   - **Interval**: ช่วงเวลาการตรวจสอบ (วินาที)
   - **Timeout**: เวลา timeout (มิลลิวินาที)
4. ตั้งค่าการแจ้งเตือน (อีเมล)
5. บันทึก

### การดู Dashboard

- **Overview**: ภาพรวมสถานะทั้งหมด
- **Monitor List**: รายการเว็บไซต์ที่ตรวจสอบ
- **Statistics**: สถิติการทำงาน
- **Recent Logs**: ประวัติการตรวจสอบล่าสุด

### การตรวจสอบ SSL Certificate

1. ไปที่ API endpoint: `/api/ssl/check/{hostname}`
2. ตัวอย่าง: `GET /api/ssl/check/google.com`

### การตรวจสอบ Domain Expiry

1. ไปที่ API endpoint: `/api/domain/check/{domain}`
2. ตัวอย่าง: `GET /api/domain/check/google.com`

## 🔧 การตั้งค่าขั้นสูง

### การตั้งค่า Email Alerts

1. ใช้ Gmail SMTP:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. สร้าง App Password ใน Google Account
3. ใช้ App Password แทนรหัสผ่านปกติ

### การตั้งค่า Monitoring Intervals

```env
DEFAULT_CHECK_INTERVAL=60      # 1 นาที
SSL_CHECK_INTERVAL=86400       # 1 วัน
DOMAIN_CHECK_INTERVAL=86400    # 1 วัน
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - สร้างบัญชีใหม่
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/profile` - ข้อมูลผู้ใช้

### Monitors
- `GET /api/monitors` - รายการ monitors
- `POST /api/monitors` - เพิ่ม monitor ใหม่
- `GET /api/monitors/:id` - ข้อมูล monitor
- `PATCH /api/monitors/:id` - แก้ไข monitor
- `DELETE /api/monitors/:id` - ลบ monitor
- `GET /api/monitors/:id/stats` - สถิติ monitor

### SSL Checking
- `GET /api/ssl/check/:hostname` - ตรวจสอบ SSL
- `GET /api/ssl/check-multiple?hostnames=domain1,domain2` - ตรวจสอบหลายโดเมน

### Domain Checking
- `GET /api/domain/check/:domain` - ตรวจสอบ domain expiry
- `GET /api/domain/check-multiple?domains=domain1,domain2` - ตรวจสอบหลายโดเมน

## 🐛 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**Q: ไม่สามารถเชื่อมต่อ Database ได้**
```bash
# ตรวจสอบสถานะ containers
docker-compose ps

# ดู logs ของ MongoDB
docker-compose logs mongodb
```

**Q: Frontend ไม่สามารถเชื่อมต่อ Backend ได้**
```bash
# ตรวจสอบ network connectivity
docker-compose logs backend
docker-compose logs frontend
```

**Q: Email alerts ไม่ทำงาน**
- ตรวจสอบการตั้งค่า SMTP ใน `.env`
- ตรวจสอบ App Password ของ Gmail
- ดู logs: `docker-compose logs backend`

### การ Debug

```bash
# เข้าไปใน container
docker-compose exec backend sh
docker-compose exec frontend sh

# ดู logs แบบ real-time
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart backend
docker-compose restart frontend
```

## 🔄 การอัปเดต

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoring และ Performance

### Database Indexes
MongoDB จะสร้าง indexes อัตโนมัติสำหรับ:
- User email (unique)
- Monitor userId
- MonitorLog monitorId และ checkedAt

### Memory Usage
- Backend: ~200-500MB
- Frontend: ~100-200MB
- MongoDB: ~500MB-1GB
- Redis: ~50-100MB

## 🔐 Security Best Practices

1. **เปลี่ยน JWT Secret**:
   ```env
   JWT_SECRET=your-very-long-and-secure-secret-key
   ```

2. **ใช้ Strong Passwords**:
   - Database passwords
   - Email passwords

3. **Enable HTTPS** (Production):
   - ใช้ SSL certificates
   - อัปเดต nginx configuration

4. **Firewall Rules**:
   - เปิดเฉพาะ ports ที่จำเป็น
   - จำกัดการเข้าถึง database

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
```

### Load Balancing
- ใช้ nginx upstream
- เพิ่ม backend instances

### Database Optimization
- MongoDB sharding
- Read replicas
- Connection pooling

## 📞 การติดต่อและสนับสนุน

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ logs ก่อน
2. ดู documentation
3. สร้าง issue ใน repository 