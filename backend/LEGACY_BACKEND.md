# Backend — Pishneefo 2049

Node + Express + SQLite อยู่ในโปรเจกต์เดียวกับหน้าเว็บ ไม่ต้องสมัครบริการอะไรเพิ่ม

---

## รันยังไง

```bash
npm install
npm run dev
```

คำสั่งเดียวขึ้นทั้งสองตัว:

| | ที่อยู่ | ทำอะไร |
|---|---|---|
| API | `http://localhost:4000` | Express + SQLite |
| หน้าเว็บ | `http://localhost:3000` | Vite dev server (proxy `/api` ไปพอร์ต 4000 ให้อัตโนมัติ) |

เปิดใช้งานที่ **`http://localhost:3000/#admin`** ครั้งแรกจะให้สร้างบัญชีผู้ดูแล

ฐานข้อมูลถูกสร้างเองที่ `data/pishneefo.db` พร้อมสินค้า 12 รายการและคำสั่งซื้อตัวอย่าง 38 รายการ
ถ้าอยากเริ่มใหม่หมด ลบโฟลเดอร์ `data/` แล้วรันใหม่

### รันแยกทีละตัว

```bash
npm run dev:api    # เฉพาะ API (พอร์ต 4000)
npm run dev:web    # เฉพาะหน้าเว็บ (พอร์ต 3000)
```

### โหมด production — พอร์ตเดียวจบ

```bash
npm run build      # type-check + build หน้าเว็บ
npm start          # Express เสิร์ฟทั้ง API และไฟล์ static
```

เปิด `http://localhost:4000` — **หน้าร้าน, admin และ API อยู่พอร์ตเดียวกันหมด**
Express มี SPA fallback ในตัว ทำให้ `/products/xxx`, `/admin`, `/checkout` ตอบ 200 ทั้งหมด
(**นี่คือการแก้ blocker ข้อ 1.2 จากรายงานรีวิว** — ไม่ต้องตั้ง SPA fallback ที่ host อีกแล้ว)

---

## ตัวแปรสภาพแวดล้อม

คัดลอกจาก `.env.example` ทั้งหมดมีค่าเริ่มต้นอยู่แล้ว ไม่ตั้งก็รันได้

| ตัวแปร | ค่าเริ่มต้น | ใช้ทำอะไร |
|---|---|---|
| `PORT` | `4000` | พอร์ตของ API |
| `DATA_DIR` | `./data` | โฟลเดอร์เก็บไฟล์ฐานข้อมูล |
| `DB_PATH` | `./data/pishneefo.db` | ระบุไฟล์ตรง ๆ (ทับ `DATA_DIR`) |
| `NODE_ENV` | — | ตั้ง `production` เพื่อบังคับ `Secure` cookie (ต้องมี HTTPS) และซ่อน stack trace |
| `TRUST_PROXY` | `1` | จำนวนชั้น reverse proxy ที่อยู่ข้างหน้า ใช้หา IP จริงของผู้ใช้ |

---

## ความปลอดภัย

สิ่งที่เปลี่ยนไปจากเวอร์ชัน localStorage — **ตอนนี้ของจริงแล้ว**

| | เวอร์ชันเดิม (localStorage) | ตอนนี้ |
|---|---|---|
| ที่ตรวจสิทธิ์ | เบราว์เซอร์ | **เซิร์ฟเวอร์** |
| ข้ามได้ด้วย DevTools ไหม | **ได้** | ไม่ได้ |
| รหัสผ่าน | PBKDF2 ในเบราว์เซอร์ | scrypt ฝั่งเซิร์ฟเวอร์ (`N=16384, r=8, p=1`) |
| session | `sessionStorage` (JS อ่านได้) | **httpOnly cookie** (JS อ่านไม่ได้) |
| ที่เก็บ token | เก็บ token ตรง ๆ | เก็บแค่ `sha256(token)` ในฐานข้อมูล |
| validate ข้อมูล | ฝั่ง client เท่านั้น | ทั้งสองฝั่ง โดยเซิร์ฟเวอร์เป็นด่านจริง |
| ราคาสินค้าตอนสั่งซื้อ | เชื่อจาก client | **คำนวณใหม่จาก DB ทุกครั้ง** |

รายละเอียดที่ทำไว้:

- **scrypt** จาก `node:crypto` — memory-hard ทนต่อการเดารหัสด้วย GPU มากกว่า PBKDF2
- **session token** สุ่ม 32 ไบต์ อายุ 7 วัน เก็บใน DB เป็น `sha256` เท่านั้น ต่อให้ไฟล์ `.db` หลุดก็ปลอมเซสชันไม่ได้
- **cookie**: `httpOnly` + `SameSite=Strict` + `Secure` (เมื่อ `NODE_ENV=production`) — กันทั้ง XSS ขโมย token และ CSRF ข้ามเว็บ
- **จำกัดการเดารหัส**: ผิด 5 ครั้งต่อ IP → ล็อก 10 นาที และคำนวณ scrypt แม้ตอนไม่เจอชื่อผู้ใช้ เพื่อไม่ให้จับเวลาเดาได้ว่าชื่อไหนมีจริง
- **เทียบ hash แบบ constant-time** ด้วย `crypto.timingSafeEqual`
- **เปลี่ยนรหัสผ่าน = เตะทุกเซสชันออก** แล้วออกใบใหม่ให้เฉพาะเครื่องที่กดเปลี่ยน
- **นำเข้าไฟล์สำรองแตะตาราง `users`/`sessions` ไม่ได้** — ไฟล์ที่คนอื่นส่งมาจึงเปลี่ยนรหัสผ่านคุณไม่ได้
- ส่วนหัว `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` และปิด `X-Powered-By`

### ยังไม่ได้ทำ (ควรทำก่อนเปิดรับเงินจริง)

- HTTPS — cookie จะเป็น `Secure` เมื่อ `NODE_ENV=production` แต่ต้องมี TLS จริงมารองรับ
- ผู้ใช้หลายคน / สิทธิ์แยกระดับ — ตอนนี้รองรับผู้ดูแลบัญชีเดียว
- อัปโหลดรูป — ยังใช้วาง URL
- ต่อ payment gateway และ FX rate จริง

---

## โครงสร้าง

```
server/
├── index.js       ตั้งค่า Express, security headers, static + SPA fallback, error handler
├── db.js          schema, migration, ตัวแปลงแถว↔object, seed
├── seed-data.js   ข้อมูลตั้งต้น (อิสระจาก src/ ฝั่งหน้าเว็บ)
├── auth.js        scrypt, session, rate limit, middleware
└── routes.js      REST endpoints ทั้งหมด + validation
```

### ตารางในฐานข้อมูล

| ตาราง | เก็บอะไร |
|---|---|
| `products` | สินค้า (คอลัมน์ปกติ + index บน `active`, `category`) |
| `orders` | คำสั่งซื้อ — `customer` และ `lines` เก็บเป็น JSON เพราะเป็น **ภาพนิ่ง ณ เวลาที่สั่ง** ที่ต้องไม่เปลี่ยนตามสินค้าปัจจุบัน |
| `journal`, `faq` | เนื้อหาเว็บไซต์ |
| `meta` | `settings` และ `about` (key-value JSON) |
| `users`, `sessions` | บัญชีผู้ดูแลและเซสชัน — **ไม่เคยถูกส่งมาที่เบราว์เซอร์** |
| `login_attempts` | ตัวนับการเดารหัสต่อ IP |

เปิด WAL mode ให้อ่านพร้อมเขียนได้โดยไม่ล็อกกัน

---

## API

### สาธารณะ (ไม่ต้องล็อกอิน)

| Method | Path | ทำอะไร |
|---|---|---|
| `GET` | `/api/health` | เช็คว่าเซิร์ฟเวอร์ยังอยู่ |
| `GET` | `/api/storefront` | สินค้าที่เปิดขาย + เนื้อหา + ตั้งค่าที่หน้าร้านต้องใช้ |
| `POST` | `/api/orders` | รับคำสั่งซื้อจากหน้าร้าน |
| `GET/POST` | `/api/auth/status`, `/setup`, `/login`, `/logout` | จัดการเซสชัน |

### ต้องล็อกอิน

| Method | Path | ทำอะไร |
|---|---|---|
| `GET` | `/api/db` | ภาพรวมข้อมูลทั้งก้อนสำหรับหน้า admin |
| `POST/PUT/PATCH/DELETE` | `/api/products[/:id]` | จัดการสินค้า (`PATCH` ใช้แก้เฉพาะสต็อก/เปิด-ปิด) |
| `PATCH` | `/api/orders/:id` | เปลี่ยนสถานะและบันทึกภายใน |
| `POST/PUT/DELETE` | `/api/journal[/:id]`, `/api/faq[/:id]` | จัดการเนื้อหา |
| `POST` | `/api/journal/reorder` | สลับลำดับบทความ |
| `PUT` | `/api/about`, `/api/settings` | บันทึกเนื้อหาและการตั้งค่า |
| `GET/POST` | `/api/export`, `/api/import` | สำรอง / กู้คืน |
| `POST` | `/api/data/reset`, `/data/clear-demo`, `/data/demo-orders` | จัดการข้อมูลตัวอย่าง |
| `POST` | `/api/auth/password` | เปลี่ยนรหัสผ่าน |

### จุดที่ควรรู้: `POST /api/orders`

Endpoint นี้เปิดสาธารณะเพราะหน้าร้านต้องเรียกได้ แต่**ไม่เชื่อตัวเลขจาก client เลย**:

```js
// ราคามาจากฐานข้อมูลเสมอ ไม่ใช่จาก request
charmsCost += charm.price;
```

ทดสอบแล้วจริง — ส่ง `unitPrice: 1` ขึ้นไปกับสินค้าราคา 129,000 × 2 ชิ้น
เซิร์ฟเวอร์คิดออกมาเป็น 288,000 (258,000 + ค่าส่ง 30,000) ไม่ใช่ 2

นอกจากนี้ยังตัดสต็อกใน transaction เดียวกัน คนสั่งพร้อมกันจึงขายเกินไม่ได้
(สั่งเกินสต็อก → `409` พร้อมบอกว่าเหลือกี่ชิ้น)

---

## ผลทดสอบ

**API (curl) — ผ่าน 56/56**

```
route ที่ต้องล็อกอินถูกปฏิเสธ 401 ทุกตัวก่อนล็อกอิน · /storefront เปิดสาธารณะได้
สร้างบัญชี: รหัสอ่อน/ชื่อสั้น/สร้างซ้ำ ถูกปฏิเสธ
validation: ชื่อว่าง ราคาติดลบ หมวดหมู่มั่ว ราคาเดิมผิด สถานะมั่ว อัตราแลกเปลี่ยน 0 → 400 ทุกกรณี
CRUD สินค้าครบ · สินค้าปิดขายหายจาก /storefront จริง
ราคาถูกคิดใหม่จาก DB (ส่ง 1 บาทมา ได้ 288,000) · สต็อกถูกตัด · สั่งเกินได้ 409
export/import · logout แล้วเข้าไม่ได้ · cookie เป็น HttpOnly + SameSite=Strict
เปลี่ยนรหัสแล้วรหัสเก่าใช้ไม่ได้
```

**เบราว์เซอร์ (Playwright) — ผ่าน 31/31 + backend อีก 16/16**

```
B3  เครื่อง B เห็นสินค้าที่เครื่อง A เพิ่ม        ← สิ่งที่ localStorage ทำไม่ได้
B5  เครื่อง A เห็นสต็อกที่ B แก้ หลังกดรีเฟรช
B6  ยัดหมวดหมู่ปลอมผ่าน DevTools → เซิร์ฟเวอร์ปฏิเสธ และ UI แจ้งเตือน
B7  บันทึกไม่สำเร็จแล้ว modal ไม่ปิด (ไม่หลอกผู้ใช้ว่าสำเร็จ)
B9  แต่ละเครื่องมีเซสชันของตัวเอง ออกจากระบบเครื่องหนึ่งไม่กระทบอีกเครื่อง
B10 document.cookie มองไม่เห็น session (httpOnly ทำงาน)
B13 เปลี่ยนรหัสผ่าน → เครื่องอื่นถูกเตะออก เครื่องที่เปลี่ยนยังอยู่
B15 เซิร์ฟเวอร์ล่ม → แสดงข้อความอธิบาย + ปุ่มลองใหม่ ไม่ใช่หน้าขาว
```

รันเองได้:

```bash
bash api-test.sh          # ต้องมี API รันอยู่
node admin-test.mjs       # ต้องมี npm run dev รันอยู่
node backend-test.mjs
```

---

## ขึ้น production

### ง่ายที่สุด — VPS + systemd

```bash
npm ci --omit=dev && npm run build
NODE_ENV=production PORT=4000 node server/index.js
```

แล้ววาง nginx ไว้ข้างหน้าเพื่อทำ TLS:

```nginx
location / {
  proxy_pass http://127.0.0.1:4000;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Host $host;
}
```

### สำรองข้อมูล

ฐานข้อมูลคือไฟล์เดียว สำรองด้วยคำสั่งเดียว (ปลอดภัยแม้ระหว่างที่เซิร์ฟเวอร์ทำงานอยู่):

```bash
sqlite3 data/pishneefo.db ".backup '/backup/pishneefo-$(date +%F).db'"
```

ตั้ง cron วันละครั้งก็พอ และกด "ดาวน์โหลดไฟล์สำรอง" ในหน้าตั้งค่าเก็บสำเนา JSON ไว้อีกชั้น

### ข้อควรระวัง

- **อย่า commit โฟลเดอร์ `data/`** — อยู่ใน `.gitignore` แล้ว
- ตั้ง `NODE_ENV=production` ไม่งั้น cookie จะไม่เป็น `Secure`
- ถ้าอยู่หลัง proxy หลายชั้น ปรับ `TRUST_PROXY` ให้ตรง ไม่งั้น rate limit จะเห็นทุกคนเป็น IP เดียว
- `better-sqlite3` เป็น native module — ถ้าใช้ Docker ต้อง build บน base image เดียวกับที่รัน

---

## ขั้นต่อไป: ต่อหน้าร้านเข้ากับ API

หลังบ้านพร้อมแล้ว เหลือแค่ฝั่งหน้าร้าน (งานประมาณครึ่งวัน):

1. `src/data/mockData.ts` → เปลี่ยนเป็นดึงจาก `GET /api/storefront`
2. `CurrencyContext` → อ่านอัตราจาก `settings.rates` ที่ API ส่งมา แทนค่าคงที่ในไฟล์
3. `LanguageContext` → อ่าน `settings.announcement`
4. หน้า checkout → `POST /api/orders` (โครง `bracelet.links[].productId` รองรับไว้แล้ว)
5. ตะกร้า → เก็บลง localStorage (blocker ข้อ 1.1 ที่ยังค้าง)
6. ช่องค้นหาหน้า Shop → ย้าย `Sidebar` ออกนอก render (blocker ข้อ 1.3 ที่ยังค้าง)

หลังจากนั้นสีสร้อยที่ลูกค้าเลือกจะถูกบันทึกลงคำสั่งซื้อจริง และหน้า admin จะแสดงใบสั่งผลิตให้ครบ
— ซึ่งเป็นบั๊กข้อ 2.1 ที่เจอตอนรีวิวและเป็นเหตุผลที่ออกแบบโครง `OrderLine.bracelet` ไว้แต่แรก
