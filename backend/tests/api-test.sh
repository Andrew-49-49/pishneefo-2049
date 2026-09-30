#!/usr/bin/env bash
# ทดสอบ API ทั้งชุดด้วย curl — ไม่พึ่งเบราว์เซอร์
API=${API_URL:-http://127.0.0.1:4000/api}
JAR=$(mktemp)
BACKUP=$(mktemp)
trap 'rm -f "$JAR" "$BACKUP"' EXIT
pass=0; fail=0

check() { # check "ชื่อ" "ค่าที่ได้" "ค่าที่คาด"
  if [ "$2" = "$3" ]; then printf "  ✓ %-52s %s\n" "$1" "$2"; pass=$((pass+1))
  else printf "  ✗ %-52s got=%s want=%s\n" "$1" "$2" "$3"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -c "$JAR" "$@"; }
body() { curl -s -b "$JAR" -c "$JAR" "$@"; }
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);console.log(eval('o.$1')??'')}catch(e){console.log('PARSE_ERR')}})"; }

echo
echo "── ก่อนล็อกอิน: ทุก route ที่แก้ข้อมูลต้องถูกปฏิเสธ ──"
check "GET  /db ไม่มี session"             "$(code $API/db)" "401"
check "POST /products ไม่มี session"       "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"x"}' $API/products)" "401"
check "DELETE /products/:id ไม่มี session" "$(code -X DELETE $API/products/charm-bai-bien)" "401"
check "PUT  /settings ไม่มี session"       "$(code -X PUT -H 'Content-Type: application/json' -d '{}' $API/settings)" "401"
check "POST /data/reset ไม่มี session"     "$(code -X POST $API/data/reset)" "401"
check "GET  /storefront เปิดสาธารณะ"        "$(code $API/storefront)" "200"

echo
echo "── สร้างบัญชี ──"
check "รหัสอ่อนถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"weak"}' $API/auth/setup)" "400"
check "ชื่อผู้ใช้สั้นเกินถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"ab","password":"Charm2049pass"}' $API/auth/setup)" "400"
check "สร้างบัญชีสำเร็จ" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"Charm2049pass"}' $API/auth/setup)" "200"
check "สร้างซ้ำถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"other","password":"Charm2049pass"}' $API/auth/setup)" "400"

echo
echo "── หลังล็อกอิน (cookie จาก setup) ──"
check "GET /db เข้าถึงได้" "$(code $API/db)" "200"
check "จำนวนสินค้าเริ่มต้น" "$(body $API/db | json 'products.length')" "12"
check "จำนวนคำสั่งซื้อตัวอย่าง" "$(body $API/db | json 'orders.length')" "38"
check "มีธงว่าเป็นข้อมูลตัวอย่าง" "$(body $API/db | json 'demoDataPresent')" "true"

echo
echo "── validation ฝั่งเซิร์ฟเวอร์ (client แก้ยังไงก็ข้ามไม่ได้) ──"
check "ชื่อว่างถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"","price":1000,"category":"Symbols","material":"Gold"}' $API/products)" "400"
check "ราคาติดลบถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"X","price":-5,"category":"Symbols","material":"Gold"}' $API/products)" "400"
check "หมวดหมู่มั่วถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"X","price":1000,"category":"Hacked","material":"Gold"}' $API/products)" "400"
check "ราคาเดิมต่ำกว่าราคาขายถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"name":"X","price":1000,"originalPrice":500,"category":"Symbols","material":"Gold"}' $API/products)" "400"
check "สถานะออร์เดอร์มั่วถูกปฏิเสธ" "$(code -X PATCH -H 'Content-Type: application/json' -d '{"status":"hacked"}' $API/orders/order-1)" "400"
check "อัตราแลกเปลี่ยน 0 ถูกปฏิเสธ" "$(code -X PUT -H 'Content-Type: application/json' -d '{"shippingFee":1,"freeShippingThreshold":1,"lowStockThreshold":1,"rates":[{"code":"VND","rateFromVND":0}]}' $API/settings)" "400"

echo
echo "── CRUD สินค้า ──"
NEW=$(body -X POST -H 'Content-Type: application/json' -d '{"name":"Test Charm","price":199000,"stock":7,"category":"Symbols","material":"Gold"}' $API/products)
PID=$(echo "$NEW" | json 'id')
check "สร้างสินค้าใหม่ได้ id" "$([ -n "$PID" ] && echo yes)" "yes"
check "slug ถูกสร้างอัตโนมัติ" "$(echo "$NEW" | json 'slug')" "test-charm"
check "สินค้ารวมเป็น 13" "$(body $API/db | json 'products.length')" "13"
check "แก้สต็อกด้วย PATCH" "$(body -X PATCH -H 'Content-Type: application/json' -d '{"stock":3}' $API/products/$PID | json 'stock')" "3"
check "ปิดขายด้วย PATCH" "$(body -X PATCH -H 'Content-Type: application/json' -d '{"active":false}' $API/products/$PID | json 'active')" "false"
check "สินค้าที่ปิดขายหายจากหน้าร้าน" "$(curl -s $API/storefront | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).products.some(p=>p.name==='Test Charm')))")" "false"
check "ลบสินค้า" "$(code -X DELETE $API/products/$PID)" "200"
check "ลบซ้ำได้ 404" "$(code -X DELETE $API/products/$PID)" "404"

echo
echo "── รับคำสั่งซื้อจากหน้าร้าน: ราคาต้องคิดใหม่จาก DB ──"
# ลูกค้าแกล้งส่งราคา 1 บาทมา — เซิร์ฟเวอร์ต้องไม่สนใจ
ORDER=$(curl -s -X POST -H 'Content-Type: application/json' -d '{
  "customer":{"firstName":"Test","lastName":"User","email":"t@example.com","phone":"0812345678","address":"1 Road","city":"Bangkok"},
  "lines":[{"type":"charm","productId":"charm-trai-tim","quantity":2,"unitPrice":1}],
  "payCurrency":"THB"}' $API/orders)
check "รับออร์เดอร์สำเร็จ" "$(echo "$ORDER" | json 'code' | cut -c1-6)" "P2049-"
# Heart Charm = 129,000 x 2 = 258,000 + ค่าส่ง 30,000 = 288,000
check "ราคาถูกคิดใหม่จาก DB ไม่ใช่จาก client" "$(echo "$ORDER" | json 'total')" "288000"
check "สต็อกถูกตัด (42 -> 40)" "$(body $API/db | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).products.find(p=>p.id==='charm-trai-tim').stock))")" "40"
check "สั่งเกินสต็อกถูกปฏิเสธ 409" "$(code -X POST -H 'Content-Type: application/json' -d '{"customer":{"firstName":"a","lastName":"b","email":"t@e.com","phone":"1","address":"a","city":"b"},"lines":[{"type":"charm","productId":"charm-neo","quantity":9999}]}' $API/orders)" "409"
check "สั่งสินค้าที่ไม่มีอยู่ถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"customer":{"firstName":"a","lastName":"b","email":"t@e.com","phone":"1","address":"a","city":"b"},"lines":[{"type":"charm","productId":"ไม่มีจริง","quantity":1}]}' $API/orders)" "400"
check "อีเมลผิดรูปแบบถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"customer":{"firstName":"a","lastName":"b","email":"ไม่ใช่อีเมล","phone":"1","address":"a","city":"b"},"lines":[{"type":"charm","productId":"charm-neo","quantity":1}]}' $API/orders)" "400"

echo
echo "── เนื้อหาและตั้งค่า ──"
AID=$(body -X POST -H 'Content-Type: application/json' -d '{"title":"บทความทดสอบ","published":true}' $API/journal | json 'id')
check "เพิ่มบทความ" "$([ -n "$AID" ] && echo yes)" "yes"
check "บทความหัวข้อว่างถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"title":"  "}' $API/journal)" "400"
check "ลบบทความ" "$(code -X DELETE $API/journal/$AID)" "200"
FID=$(body -X POST -H 'Content-Type: application/json' -d '{"question":"ทดสอบ?","answer":"ได้"}' $API/faq | json 'id')
check "เพิ่ม FAQ แล้วลบ" "$(code -X DELETE $API/faq/$FID)" "200"
check "บันทึกค่าส่งใหม่" "$(body -X PUT -H 'Content-Type: application/json' -d '{"storeName":"Pishneefo 2049","shippingFee":45000,"freeShippingThreshold":500000,"lowStockThreshold":10,"rates":[{"code":"VND","label":"d","symbol":"₫","rateFromVND":1,"decimals":0},{"code":"THB","label":"b","symbol":"฿","rateFromVND":0.00136538,"decimals":0}]}' $API/settings | json 'shippingFee')" "45000"

echo
echo "── สำรอง / กู้คืน ──"
check "export ได้" "$(code $API/export)" "200"
body $API/export > "$BACKUP"
check "import ไฟล์เสียถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"products":"ไม่ใช่ array"}' $API/import)" "400"
check "import ไฟล์ที่ export มาสำเร็จ" "$(code -X POST -H 'Content-Type: application/json' -d "@$BACKUP" $API/import)" "200"
check "ล้างข้อมูลตัวอย่าง" "$(code -X POST $API/data/clear-demo)" "200"

echo
echo "── ออกจากระบบแล้วต้องเข้าไม่ได้อีก ──"
check "logout" "$(code -X POST $API/auth/logout)" "200"
check "GET /db หลัง logout" "$(code $API/db)" "401"
check "ล็อกอินรหัสผิด" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"WrongPass123"}' $API/auth/login)" "401"
check "ล็อกอินรหัสถูก" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"Charm2049pass"}' $API/auth/login)" "200"
check "เข้าถึง /db ได้อีกครั้ง" "$(code $API/db)" "200"

echo
echo "── cookie ต้องเป็น httpOnly (JS อ่านไม่ได้) ──"
HDR=$(curl -si -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"Charm2049pass"}' $API/auth/login | grep -i '^set-cookie')
check "cookie มี HttpOnly" "$(echo "$HDR" | grep -ci httponly)" "1"
check "cookie มี SameSite=Strict" "$(echo "$HDR" | grep -ci 'samesite=strict')" "1"

echo
echo "── เปลี่ยนรหัสผ่าน ──"
check "รหัสปัจจุบันผิดถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"current":"ผิด","next":"NewCharm2049"}' $API/auth/password)" "400"
check "รหัสใหม่อ่อนถูกปฏิเสธ" "$(code -X POST -H 'Content-Type: application/json' -d '{"current":"Charm2049pass","next":"weak"}' $API/auth/password)" "400"
check "เปลี่ยนรหัสสำเร็จ" "$(code -X POST -H 'Content-Type: application/json' -d '{"current":"Charm2049pass","next":"NewCharm2049x"}' $API/auth/password)" "200"
check "รหัสเก่าใช้ไม่ได้แล้ว" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"Charm2049pass"}' $API/auth/login)" "401"
check "รหัสใหม่ใช้ได้" "$(code -X POST -H 'Content-Type: application/json' -d '{"username":"anong","password":"NewCharm2049x"}' $API/auth/login)" "200"

echo
echo "── endpoint ที่ไม่มีจริง ──"
check "GET /api/ไม่มีจริง คืน 404 JSON" "$(code $API/ไม่มีจริง)" "404"

echo
printf "\n  ผ่าน %d · ไม่ผ่าน %d\n\n" "$pass" "$fail"
rm -f "$JAR"
[ "$fail" -eq 0 ]
