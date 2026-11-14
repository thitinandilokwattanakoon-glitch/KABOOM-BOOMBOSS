# นำ Kaboom บูมบอส ขึ้นออนไลน์ (เปิดตลอด ไม่ต้องเปิดปิดเอง)

แยกวาง 2 ส่วน:

- **backend** (ตัวเกม + ฐานข้อมูล) บน **Railway**: ไม่หลับ เก็บข้อมูลถาวร ค่าใช้จ่ายประมาณ 5 ดอลลาร์ต่อเดือน (แพ็กเกจ Hobby)
- **frontend** (หน้าเว็บ) บน **Vercel**: ฟรี

ทั้งสองบริการดึงโค้ดจาก GitHub repo `KABOOM-BOOMBOSS` และอัปเดตเว็บเองทุกครั้งที่ push โค้ดใหม่

> ข้อมูลในเครื่องคอม (บัญชี ชุดคำถาม ผลเกม) **ไม่ได้ย้ายขึ้นไปด้วย** เว็บออนไลน์จะเริ่มจากฐานข้อมูลว่าง ต้องสมัครบัญชีใหม่บนเว็บ

---

## ขั้นที่ 1: backend บน Railway

1. เข้า https://railway.com แล้วกด **Login** → **Login with GitHub**
2. เลือกแพ็กเกจ **Hobby** และใส่วิธีชำระเงินเอง (ห้ามให้คนอื่นใส่แทน)
3. กด **New Project** → **Deploy from GitHub repo** → เลือก `KABOOM-BOOMBOSS`
4. กดที่กล่องของ service ที่ได้ → แท็บ **Settings**
   - **Root Directory**: พิมพ์ `backend` (Railway จะเจอไฟล์ `Dockerfile` เอง)
5. คลิกขวาที่กล่อง service → **Attach Volume** (หรือ **+ New → Volume**)
   - **Mount path**: `/data`
   ตรงนี้คือที่เก็บฐานข้อมูลถาวร ถ้าข้ามขั้นนี้ ข้อมูลจะหายทุกครั้งที่ระบบรีสตาร์ท
6. แท็บ **Variables** → เพิ่มทีละตัว:

   | ชื่อ | ค่า |
   | --- | --- |
   | `SPRING_DATASOURCE_URL` | `jdbc:h2:file:/data/kaboom` |
   | `APP_CORS_ALLOWEDORIGINS` | ใส่ชั่วคราวเป็น `http://localhost:5173` (จะแก้ในขั้นที่ 3) |
   | `APP_FRONTENDURL` | ใส่ชั่วคราวเป็น `http://localhost:5173` (จะแก้ในขั้นที่ 3) |

7. แท็บ **Settings** → **Networking** → กด **Generate Domain**
   จะได้ที่อยู่แบบ `https://ชื่อ-production.up.railway.app` **คัดลอกเก็บไว้**
   (ไม่ต้องตั้งพอร์ต ระบบใช้ค่า `PORT` ที่ Railway ให้มาเอง)
8. รอจนสถานะเป็น **Active / Success** แล้วลองเปิด `ที่อยู่ที่ได้/api/health` ในเบราว์เซอร์ ต้องเห็นข้อความตอบกลับ ไม่ใช่หน้า error

## ขั้นที่ 2: frontend บน Vercel

1. เข้า https://vercel.com → **Sign Up / Log in** → **Continue with GitHub** (แพ็กเกจ Hobby ฟรี)
2. **Add New… → Project** → เลือก `KABOOM-BOOMBOSS` → **Import**
3. **Root Directory**: กด **Edit** แล้วเลือก `frontend` (Framework จะขึ้น Vite เอง)
4. เปิด **Environment Variables** แล้วเพิ่ม:

   | ชื่อ | ค่า |
   | --- | --- |
   | `VITE_API_BASE` | ที่อยู่ Railway จากขั้นที่ 1 ข้อ 7 เช่น `https://ชื่อ-production.up.railway.app` **ห้ามมี `/` ปิดท้าย** |

5. กด **Deploy** รอเสร็จ จะได้ที่อยู่แบบ `https://ชื่อ.vercel.app` **คัดลอกเก็บไว้**

## ขั้นที่ 3: ให้สองฝั่งรู้จักกัน

กลับไป Railway → service → **Variables** แก้สองตัวนี้เป็นที่อยู่ Vercel จากขั้นที่ 2 (ห้ามมี `/` ปิดท้าย):

| ชื่อ | ค่า |
| --- | --- |
| `APP_CORS_ALLOWEDORIGINS` | `https://ชื่อ.vercel.app` |
| `APP_FRONTENDURL` | `https://ชื่อ.vercel.app` |

Railway จะรีสตาร์ทเอง รอสักครู่ แล้วเปิดเว็บ Vercel ลองสมัครครู สร้างชุดคำถาม เปิดห้อง และให้นักเรียนเข้าจากอีกเครื่อง

## (ไม่บังคับ) ให้ "ลืมรหัสผ่าน" ส่งอีเมลจริง

เพิ่มใน Railway → Variables (ใช้ Gmail ต้องสร้าง App Password ก่อน ห้ามใช้รหัส Gmail ปกติ):

| ชื่อ | ค่า |
| --- | --- |
| `SPRING_MAIL_HOST` | `smtp.gmail.com` |
| `SPRING_MAIL_PORT` | `587` |
| `SPRING_MAIL_USERNAME` | อีเมลที่จะใช้ส่ง |
| `SPRING_MAIL_PASSWORD` | App Password (ใส่เองในหน้า Railway เท่านั้น ห้ามใส่ในโค้ดหรือส่งให้ใคร) |

ถ้าไม่ตั้ง ลิงก์ตั้งรหัสใหม่จะไปอยู่ใน **Deploy Logs** ของ Railway แทน

---

## เรื่องที่ควรรู้

- **แก้ที่อยู่ backend ทีหลัง** (เปลี่ยน `VITE_API_BASE`) ต้องกด **Redeploy** ใน Vercel ด้วย เพราะค่านี้ถูกฝังตอนสร้างเว็บ
- **ห้องเกมเก็บในหน่วยความจำ** ถ้า Railway รีสตาร์ท (เช่นตอน push โค้ดใหม่) ห้องที่กำลังเล่นจะหาย ส่วนบัญชี ชุดคำถาม ผลเกม อยู่ครบใน Volume ควร push โค้ดตอนไม่มีคนเล่น
- **ใช้ backend ตัวเดียว** อย่าเพิ่มจำนวน replicas ใน Railway เพราะห้องเกมจะแยกกันอยู่คนละเครื่อง
- **สำรองข้อมูล**: Railway → Volume → **Backups** เปิดสำรองอัตโนมัติได้
- ทั้งสองที่ให้ `https://` มาเอง ซึ่งจำเป็นสำหรับการถ่ายรูปจากกล้อง
- ราคาและหน้าตาเว็บของ Railway / Vercel อาจเปลี่ยนจากที่เขียนไว้ ให้ดูหน้าราคาของแต่ละบริการก่อนสมัคร
