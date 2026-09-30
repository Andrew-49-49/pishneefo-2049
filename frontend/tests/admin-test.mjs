import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const B = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const br = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const page = await br.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push('console: ' + m.text().slice(0, 160)); });

const R = [];
const log = (k, v) => { R.push(`${k}: ${v}`); };
const step = async (name, fn) => { try { await fn(); } catch (e) { log(`✗ ${name}`, String(e).split('\n')[0].slice(0, 140)); } };

/* ---------- 1. first run: setup screen ---------- */
await page.goto(B + '/#admin/dashboard', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await step('setup', async () => {
  const heading = await page.locator('h2').first().innerText();
  log('T1 first-run screen', JSON.stringify(heading.trim()));
  await page.screenshot({ path: `${OUT}01-setup.png` });

  // รหัสอ่อนต้องถูกปฏิเสธ
  await page.fill('input[autocomplete=username]', 'anong');
  await page.locator('input[autocomplete=new-password]').first().fill('weak');
  await page.waitForTimeout(200);
  const warnings = await page.locator('ul[aria-live=polite] li').count();
  log('T2 weak password shows warnings', warnings > 0 ? `YES (${warnings})` : 'NO');

  // รหัสไม่ตรงกัน
  const pw = page.locator('input[autocomplete=new-password]');
  await pw.nth(0).fill('Charm2049pass');
  await pw.nth(1).fill('Charm2049different');
  await page.getByRole('button', { name: /สร้างบัญชี/ }).click();
  await page.waitForTimeout(300);
  log('T3 mismatch rejected', (await page.locator('[role=alert]').count()) > 0 ? 'YES' : 'NO');

  await pw.nth(1).fill('Charm2049pass');
  await page.getByRole('button', { name: /สร้างบัญชี/ }).click();
  await page.waitForTimeout(1500);
  log('T4 account created + logged in', (await page.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');
});

/* ---------- 2. dashboard ---------- */
await step('dashboard', async () => {
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}02-dashboard.png`, fullPage: true });
  const tiles = await page.locator('main .tabular-nums').first().innerText();
  log('T5 dashboard revenue tile', JSON.stringify(tiles.trim()));
  const bars = await page.locator('main svg rect[rx]').count();
  log('T6 chart bars rendered', bars);

  // hover tooltip
  const hoverTargets = page.locator('main svg rect[fill=transparent]');
  const n = await hoverTargets.count();
  if (n > 5) {
    await hoverTargets.nth(Math.floor(n * 0.8)).hover();
    await page.waitForTimeout(300);
    const tip = await page.locator('main .pointer-events-none.absolute').count();
    log('T7 chart hover tooltip', tip > 0 ? 'YES' : 'NO');
  }

  // table fallback
  await page.getByRole('button', { name: 'ดูเป็นตาราง' }).first().click();
  await page.waitForTimeout(300);
  log('T8 chart table fallback rows', await page.locator('main table tbody tr').count());
  await page.getByRole('button', { name: 'ซ่อนตาราง' }).first().click();
});

/* ---------- 3. products ---------- */
await step('products', async () => {
  await page.getByRole('button', { name: 'สินค้า' }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}03-products.png`, fullPage: true });
  log('T9 product rows', await page.locator('main tbody tr').count());

  // ค้นหา (ต้องพิมพ์ได้ครบ ไม่หลุด focus แบบหน้าร้าน)
  const search = page.locator('input[type=search]').first();
  await search.click();
  await page.keyboard.type('ocean', { delay: 60 });
  await page.waitForTimeout(300);
  log('T10 search keeps focus & full text', JSON.stringify(await search.inputValue()));
  log('T10b filtered rows', await page.locator('main tbody tr').count());
  await search.fill('');
  await page.waitForTimeout(300);

  // แก้สต็อกในตาราง
  const stockInput = page.locator('main tbody tr input[type=number]').first();
  await stockInput.fill('3');
  await page.waitForTimeout(400);
  const cls = await stockInput.getAttribute('class');
  log('T11 low-stock highlight applied', /amber/.test(cls ?? '') ? 'YES' : 'NO');

  // เปิดฟอร์มแก้ไข
  await page.locator('main tbody tr button[aria-label^="แก้ไข"]').first().click();
  await page.waitForTimeout(500);
  log('T12 edit modal has dialog role', await page.locator('[role=dialog][aria-modal=true]').count());
  await page.screenshot({ path: `${OUT}04-product-edit.png` });

  // validation
  await page.locator('[role=dialog] input').first().fill('');
  await page.getByRole('button', { name: /บันทึกการแก้ไข/ }).click();
  await page.waitForTimeout(300);
  log('T13 empty name blocked', (await page.locator('[role=dialog]').count()) > 0 ? 'YES (modal stays open)' : 'NO');

  // Escape ปิด modal ได้
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  log('T14 Escape closes modal', (await page.locator('[role=dialog]').count()) === 0 ? 'YES' : 'NO');

  // สร้างสินค้าใหม่
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).click();
  await page.waitForTimeout(400);
  const dlg = page.locator('[role=dialog]');
  await dlg.locator('input').first().fill('Test Charm ทดสอบ');
  await dlg.locator('input[type=number]').first().fill('199000');
  await dlg.locator('input[type=number]').nth(2).fill('7');
  await page.getByRole('button', { name: 'เพิ่มสินค้า' }).last().click();
  await page.waitForTimeout(600);
  log('T15 new product added', await page.locator('main tbody tr').count());
  log('T15b toast is in aria-live region', await page.locator('[role=status][aria-live=polite]').count());
});

/* ---------- 4. orders ---------- */
await step('orders', async () => {
  await page.getByRole('button', { name: /^คำสั่งซื้อ/ }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}05-orders.png`, fullPage: true });
  log('T16 order rows', await page.locator('main tbody tr').count());

  // เปิดออร์เดอร์ที่มีสร้อยกำหนดเอง
  const braceletRow = page.locator('main tbody tr', { hasText: 'สร้อย' }).first();
  const hasBracelet = (await braceletRow.count()) > 0;
  await (hasBracelet ? braceletRow : page.locator('main tbody tr').first()).click();
  await page.waitForTimeout(600);
  const dlgText = await page.locator('[role=dialog]').innerText();
  log('T17 order detail shows finish colour', /สี:/.test(dlgText) ? 'YES' : 'NO (no bracelet in this order)');
  log('T18 order detail shows per-link build sheet', /ข้อ \d+/.test(dlgText) ? 'YES' : 'NO');
  await page.screenshot({ path: `${OUT}06-order-detail.png` });

  // เปลี่ยนสถานะ
  const sel = page.locator('[role=dialog] select').first();
  await sel.selectOption('shipped');
  await page.waitForTimeout(500);
  log('T19 status change persisted', await sel.inputValue());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
});

/* ---------- 5. content ---------- */
await step('content', async () => {
  await page.getByRole('button', { name: 'เนื้อหา' }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}07-content.png`, fullPage: true });
  log('T20 journal items', await page.locator('main ul > li').count());
  await page.getByRole('tab', { name: /คำถามที่พบบ่อย/ }).click();
  await page.waitForTimeout(400);
  log('T21 faq items', await page.locator('main ul > li').count());
});

/* ---------- 6. settings ---------- */
await step('settings', async () => {
  await page.getByRole('button', { name: 'ตั้งค่า' }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}08-settings.png`, fullPage: true });

  // แก้ค่าส่ง -> แถบบันทึกต้องโผล่
  const fee = page.locator('main input[type=number]').first();
  await fee.fill('45000');
  await page.waitForTimeout(400);
  log('T22 unsaved-changes bar appears', (await page.getByText('มีการแก้ไขที่ยังไม่ได้บันทึก').count()) > 0 ? 'YES' : 'NO');
  await page.getByRole('button', { name: 'บันทึกการตั้งค่า' }).click();
  await page.waitForTimeout(500);
  log('T23 saved', (await page.getByText('มีการแก้ไขที่ยังไม่ได้บันทึก').count()) === 0 ? 'YES' : 'NO');
});

/* ---------- 7. persistence + currency + auth ---------- */
await step('persistence', async () => {
  await page.goto(B + '/#admin/products', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const rows = await page.locator('main tbody tr').count();
  log('T24 data survives full page reload', rows >= 13 ? `YES (${rows} products incl. the new one)` : `NO (${rows})`);
  log('T25 still logged in after reload (same tab)', (await page.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');

  // สลับสกุลเงิน
  const before = await page.locator('main tbody tr td').nth(2).innerText();
  await page.locator('header select').selectOption('USD');
  await page.waitForTimeout(500);
  const after = await page.locator('main tbody tr td').nth(2).innerText();
  log('T26 currency switch', `${before.trim().split('\n')[0]} → ${after.trim().split('\n')[0]}`);
});

await step('auth', async () => {
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await page.waitForTimeout(600);
  log('T27 logout returns to login', (await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).count()) > 0 ? 'YES' : 'NO');
  await page.screenshot({ path: `${OUT}09-login.png` });

  // รหัสผิด
  await page.fill('input[autocomplete=username]', 'anong');
  await page.fill('input[autocomplete=current-password]', 'WrongPass123');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForTimeout(1200);
  const alert = await page.locator('[role=alert]').innerText().catch(() => '');
  log('T28 wrong password rejected', JSON.stringify(alert.trim().slice(0, 70)));

  // รหัสถูก
  await page.fill('input[autocomplete=current-password]', 'Charm2049pass');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForTimeout(1500);
  log('T29 correct password logs in', (await page.locator('nav[aria-label="เมนูหลัก"]').count()) > 0 ? 'YES' : 'NO');
});

/* ---------- 8. storefront untouched ---------- */
await step('storefront', async () => {
  await page.goto(B + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const h1 = await page.locator('h1').first().innerText();
  log('T30 storefront still works', JSON.stringify(h1.trim().slice(0, 40)));
  log('T31 no admin UI leaked into storefront', (await page.locator('nav[aria-label="เมนูหลัก"]').count()) === 0 ? 'YES' : 'NO');
});

// (ชุดทดสอบมือถืออยู่ใน admin-mobile.mjs — แท็บใหม่ = sessionStorage ใหม่ จึงต้องล็อกอินแยก)

log('CONSOLE ERRORS', errs.length ? JSON.stringify([...new Set(errs)].slice(0, 5)) : 'none');
console.log(R.join('\n'));
await br.close();
