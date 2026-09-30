import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * ทดสอบสิ่งที่ backend เพิ่มเข้ามาโดยเฉพาะ — สิ่งที่เวอร์ชัน localStorage ทำไม่ได้
 */
const B = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const R = [];
const log = (k, v) => R.push(`${k}: ${v}`);

const browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });

async function loginTab(ctx, { expectSetup = false } = {}) {
  const page = await ctx.newPage();
  await page.goto(B + '/#admin/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const isSetup = (await page.getByRole('button', { name: /สร้างบัญชี/ }).count()) > 0;
  if (expectSetup !== null) log('   (หน้าที่เจอ)', isSetup ? 'ตั้งค่าครั้งแรก' : 'ล็อกอิน');
  await page.fill('input[autocomplete=username]', 'anong');
  if (isSetup) {
    const pw = page.locator('input[autocomplete=new-password]');
    await pw.nth(0).fill('Charm2049pass');
    await pw.nth(1).fill('Charm2049pass');
    await page.getByRole('button', { name: /สร้างบัญชี/ }).click();
  } else {
    await page.fill('input[autocomplete=current-password]', 'Charm2049pass');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  }
  await page.waitForTimeout(2200);
  return page;
}

/* ── 1. เครื่องที่ 1 แก้ข้อมูล ── */
const ctxA = await browser.newContext();
const a = await loginTab(ctxA);
log('B1 เครื่อง A เข้าระบบได้', (await a.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');

await a.goto(B + '/#admin/products', { waitUntil: 'networkidle' });
await a.waitForTimeout(1200);
await a.getByRole('button', { name: 'เพิ่มสินค้า' }).click();
await a.waitForTimeout(500);
const dlg = a.locator('[role=dialog]');
await dlg.locator('input').first().fill('สินค้าจากเครื่อง A');
await dlg.locator('input[type=number]').first().fill('222000');
await dlg.locator('input[type=number]').nth(2).fill('5');
await a.getByRole('button', { name: 'เพิ่มสินค้า' }).last().click();
await a.waitForTimeout(1200);
log('B2 เครื่อง A เพิ่มสินค้าแล้วมี', await a.locator('main tbody tr').count());

/* ── 2. เครื่องที่ 2 (คนละ browser context = คนละเครื่อง) ต้องเห็นข้อมูลชุดเดียวกัน ── */
const ctxB = await browser.newContext();
const b = await loginTab(ctxB);
await b.goto(B + '/#admin/products', { waitUntil: 'networkidle' });
await b.waitForTimeout(1400);
const seenOnB = await b.locator('main tbody tr', { hasText: 'สินค้าจากเครื่อง A' }).count();
log('B3 เครื่อง B เห็นสินค้าที่ A เพิ่ม (ข้ามเครื่องได้)', seenOnB > 0 ? 'YES ← สิ่งที่ localStorage ทำไม่ได้' : 'NO');
log('B4 เครื่อง B นับสินค้าได้เท่ากัน', await b.locator('main tbody tr').count());

/* ── 3. เครื่อง B แก้สต็อก แล้วเครื่อง A กดรีเฟรชต้องเห็น ── */
const stockOnB = b.locator('main tbody tr', { hasText: 'สินค้าจากเครื่อง A' }).locator('input[type=number]');
await stockOnB.fill('77');
await b.waitForTimeout(1200);
await a.locator('header button[aria-label="ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์"]').click();
await a.waitForTimeout(1500);
const stockOnA = await a.locator('main tbody tr', { hasText: 'สินค้าจากเครื่อง A' }).locator('input[type=number]').inputValue();
log('B5 เครื่อง A เห็นสต็อกที่ B แก้ (77)', stockOnA);

/* ── 4. เซิร์ฟเวอร์ปฏิเสธข้อมูลผิด แล้ว UI ต้องแจ้งเตือน ไม่ใช่เงียบ ── */
await a.getByRole('button', { name: 'เพิ่มสินค้า' }).click();
await a.waitForTimeout(500);
const dlg2 = a.locator('[role=dialog]');
await dlg2.locator('input').first().fill('ราคาเกินขอบเขต');
await dlg2.locator('input[type=number]').first().fill('1000');
// แอบยัดหมวดหมู่ที่ไม่มีจริงเข้าไปใน select เลียนแบบคนที่แก้ DOM ผ่าน DevTools
await a.evaluate(() => {
  const select = [...document.querySelectorAll('[role=dialog] select')][0];
  const opt = document.createElement('option');
  opt.value = 'Hacked'; opt.textContent = 'Hacked';
  select.appendChild(opt);
  select.value = 'Hacked';
  select.dispatchEvent(new Event('change', { bubbles: true }));
});
await a.waitForTimeout(300);
await a.getByRole('button', { name: 'เพิ่มสินค้า' }).last().click();
await a.waitForTimeout(1500);
const toastText = await a.locator('[role=status]').innerText().catch(() => '');
log('B6 เซิร์ฟเวอร์ปฏิเสธหมวดหมู่ปลอม และ UI แจ้งเตือน', /หมวดหมู่ไม่ถูกต้อง/.test(toastText) ? 'YES' : `NO (toast="${toastText.trim()}")`);
log('B7 modal ยังเปิดอยู่ ไม่ปิดทั้งที่บันทึกไม่สำเร็จ', (await a.locator('[role=dialog]').count()) > 0 ? 'YES' : 'NO');
await a.keyboard.press('Escape');
await a.waitForTimeout(400);

/* ── 5. ออกจากระบบที่ A แล้ว cookie ของ B ต้องยังใช้ได้ (คนละเซสชัน) ── */
await a.goto(B + '/#admin/dashboard', { waitUntil: 'networkidle' });
await a.waitForTimeout(1000);
await a.getByRole('button', { name: 'ออกจากระบบ' }).click();
await a.waitForTimeout(1200);
log('B8 A ออกจากระบบแล้วเจอหน้าล็อกอิน', (await a.getByRole('button', { name: 'เข้าสู่ระบบ' }).count()) > 0 ? 'YES' : 'NO');
await b.reload({ waitUntil: 'networkidle' });
await b.waitForTimeout(1600);
log('B9 B ยังอยู่ในระบบ (เซสชันแยกกัน)', (await b.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');

/* ── 6. JavaScript ต้องอ่าน session cookie ไม่ได้ ── */
const cookieVisible = await b.evaluate(() => document.cookie);
log('B10 document.cookie มองเห็น session ไหม', cookieVisible.includes('p2049_session') ? 'เห็น (แย่)' : 'ไม่เห็น (httpOnly ทำงาน)');

/* ── 7. เปลี่ยนรหัสผ่านแล้วเซสชันอื่นต้องถูกเตะออก ── */
await b.goto(B + '/#admin/settings', { waitUntil: 'networkidle' });
await b.waitForTimeout(1400);
const ctxC = await browser.newContext();
const c = await loginTab(ctxC);
log('B11 เครื่อง C เข้าระบบได้ก่อนเปลี่ยนรหัส', (await c.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');

const pwInputs = b.locator('form input[type=password]');
await pwInputs.nth(0).fill('Charm2049pass');
await pwInputs.nth(1).fill('BrandNew2049pw');
await pwInputs.nth(2).fill('BrandNew2049pw');
await b.getByRole('button', { name: 'เปลี่ยนรหัสผ่าน' }).click();
await b.waitForTimeout(2000);
const pwToast = await b.locator('[role=status]').innerText().catch(() => '');
log('B12 เปลี่ยนรหัสสำเร็จ', /เปลี่ยนรหัสผ่านแล้ว/.test(pwToast) ? 'YES' : `NO ("${pwToast.trim()}")`);

await c.reload({ waitUntil: 'networkidle' });
await c.waitForTimeout(1800);
log('B13 เครื่อง C ถูกเตะออกหลังเปลี่ยนรหัส', (await c.getByRole('button', { name: 'เข้าสู่ระบบ' }).count()) > 0 ? 'YES' : 'NO');
log('B14 เครื่อง B ที่เปลี่ยนรหัสยังอยู่ในระบบ', (await b.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');

/* ── 8. เซิร์ฟเวอร์ล่ม → UI ต้องบอกให้รู้ ไม่ใช่หน้าขาว ── */
await b.route('**/api/**', (route) => route.abort('failed'));
await b.reload({ waitUntil: 'domcontentloaded' });
await b.waitForTimeout(2500);
const offlineText = await b.locator('body').innerText();
log('B15 เซิร์ฟเวอร์ติดต่อไม่ได้ → แสดงข้อความอธิบาย', /เชื่อมต่อเซิร์ฟเวอร์ไม่ได้/.test(offlineText) ? 'YES' : 'NO');
log('B16 มีปุ่มลองใหม่', /ลองใหม่/.test(offlineText) ? 'YES' : 'NO');

await b.screenshot({ path: `${OUT}20-offline.png` });

console.log(R.join('\n'));
await browser.close();
