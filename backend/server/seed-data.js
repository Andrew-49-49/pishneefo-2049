/**
 * ข้อมูลตั้งต้นของเซิร์ฟเวอร์
 *
 * ตั้งใจให้ไฟล์นี้เป็นอิสระจาก src/ ฝั่งหน้าเว็บ — เซิร์ฟเวอร์ไม่ควรต้อง
 * คอมไพล์ TypeScript ของ frontend เพียงเพื่อจะ seed ฐานข้อมูลครั้งเดียว
 * หลังจาก seed แล้ว แหล่งความจริงคือฐานข้อมูล ไม่ใช่ไฟล์นี้
 */

const img = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&q=88&w=${width}`;

export const CATALOG = [
  {
    id: 'charm-bai-bien', slug: 'beach-memory-italian-charm', name: 'Beach Memory Italian Charm',
    price: 159000, originalPrice: 189000, category: 'Tropical', material: 'Silver',
    image: img('photo-1599643478518-a784e5dc4c8f'),
    gallery: [img('photo-1599643478518-a784e5dc4c8f', 1200), img('photo-1515562141207-7a88fb7ce338', 1200), img('photo-1535632787350-4e68ef0ac584', 1200), img('photo-1535632066927-ab7c9ab60908', 1200)],
    shortDescription: 'A tiny reminder of bright days, blue water and trips you never want to forget.',
    description: 'A polished modular Italian Charm designed to mix easily with letters, symbols and travel memories. Build a bracelet that tells your story one link at a time.',
    sku: 'P2049-IC-BEACH01', stock: 24, badge: 'Best seller', isFeatured: true,
  },
  {
    id: 'charm-mat-troi', slug: 'sunshine-italian-charm', name: 'Sunshine Italian Charm',
    price: 149000, category: 'Tropical', material: 'Gold', image: img('photo-1611591475285-a30ae242c222'),
    gallery: [img('photo-1611591475285-a30ae242c222', 1200), img('photo-1515562141207-7a88fb7ce338', 1200)],
    shortDescription: 'A warm little symbol for bright energy and golden days.',
    description: 'Sun-inspired charm with a warm gold finish, easy to pair with letters or colorful symbols.',
    sku: 'P2049-IC-SUN01', stock: 18, badge: 'New', isFeatured: true,
  },
  {
    id: 'charm-vo-so', slug: 'shell-italian-charm', name: 'Seashell Italian Charm',
    price: 139000, category: 'Shells', material: 'Gold', image: img('photo-1515562141207-7a88fb7ce338'),
    gallery: [img('photo-1515562141207-7a88fb7ce338', 1200), img('photo-1605100804763-247f67b3557e', 1200)],
    shortDescription: 'A minimal shell that feels like a small piece of a seaside holiday.',
    description: 'An easy everyday charm and a thoughtful gift for anyone who loves the coast.',
    sku: 'P2049-IC-SHELL01', stock: 31, isFeatured: true,
  },
  {
    id: 'charm-song-bien', slug: 'ocean-wave-italian-charm', name: 'Ocean Wave Italian Charm',
    price: 159000, category: 'Waves', material: 'Silver', image: img('photo-1535632787350-4e68ef0ac584'),
    gallery: [img('photo-1535632787350-4e68ef0ac584', 1200), img('photo-1599643478518-a784e5dc4c8f', 1200)],
    description: 'Inspired by the rhythm of the sea, made for travel, summer and freedom-themed bracelets.',
    sku: 'P2049-IC-WAVE01', stock: 14,
  },
  {
    id: 'charm-sao-bien', slug: 'starfish-italian-charm', name: 'Starfish Italian Charm',
    price: 169000, category: 'Sea Life', material: 'Gold', image: img('photo-1605100804763-247f67b3557e'),
    gallery: [img('photo-1605100804763-247f67b3557e', 1200), img('photo-1535632066927-ab7c9ab60908', 1200)],
    description: 'A bright starfish symbol that adds an ocean accent to any charm story.',
    sku: 'P2049-IC-STAR01', stock: 20,
  },
  {
    id: 'charm-ca-heo', slug: 'dolphin-italian-charm', name: 'Dolphin Italian Charm',
    price: 159000, category: 'Sea Life', material: 'Silver', image: img('photo-1506630448388-4e683c67ddb0'),
    gallery: [img('photo-1506630448388-4e683c67ddb0', 1200), img('photo-1535632787350-4e68ef0ac584', 1200)],
    description: 'A playful reminder of joy, freedom and adventures still ahead.',
    sku: 'P2049-IC-DOL01', stock: 11,
  },
  {
    id: 'charm-trai-tim', slug: 'heart-italian-charm', name: 'Heart Italian Charm',
    price: 129000, category: 'Symbols', material: 'Silver', image: img('photo-1518199266791-5375a83190b7'),
    gallery: [img('photo-1518199266791-5375a83190b7', 1200), img('photo-1535632066927-ab7c9ab60908', 1200)],
    description: 'A simple, timeless symbol for someone you love.',
    sku: 'P2049-IC-HEART01', stock: 42,
  },
  {
    id: 'charm-chu-a', slug: 'letter-a-italian-charm', name: 'Letter A Italian Charm',
    price: 119000, category: 'Letters', material: 'Gold', image: img('photo-1588850561407-ed78c282e89b'),
    gallery: [img('photo-1588850561407-ed78c282e89b', 1200), img('photo-1515562141207-7a88fb7ce338', 1200)],
    description: 'A personal initial charm made for names, places and private meanings.',
    sku: 'P2049-IC-A01', stock: 35,
  },
  {
    id: 'charm-may-man', slug: 'lucky-italian-charm', name: 'Lucky Italian Charm',
    price: 149000, category: 'Symbols', material: 'Gold', image: img('photo-1535632066927-ab7c9ab60908'),
    gallery: [img('photo-1535632066927-ab7c9ab60908', 1200), img('photo-1605100804763-247f67b3557e', 1200)],
    description: 'A small daily reminder of good luck and good timing.',
    sku: 'P2049-IC-LUCK01', stock: 16,
  },
  {
    id: 'charm-neo', slug: 'anchor-italian-charm', name: 'Anchor Italian Charm',
    price: 149000, category: 'Sea Life', material: 'Gold', image: img('photo-1579783902614-a3fb3927b675'),
    gallery: [img('photo-1579783902614-a3fb3927b675', 1200), img('photo-1535632787350-4e68ef0ac584', 1200)],
    description: 'A symbol of steadiness, home and journeys across open water.',
    sku: 'P2049-IC-ANCHOR01', stock: 9,
  },
  {
    id: 'charm-coral', slug: 'coral-italian-charm', name: 'Coral Italian Charm',
    price: 169000, category: 'Sea Life', material: 'Mixed Metal', image: img('photo-1544816155-12df9643f363'),
    gallery: [img('photo-1544816155-12df9643f363', 1200), img('photo-1599643478518-a784e5dc4c8f', 1200)],
    description: 'A bright coral accent for colorful summer bracelets.',
    sku: 'P2049-IC-CORAL01', stock: 8,
  },
  {
    id: 'charm-infinity', slug: 'infinity-italian-charm', name: 'Infinity Italian Charm',
    price: 139000, category: 'Symbols', material: 'Gold', image: img('photo-1617038260897-41a1f14a8ca0'),
    gallery: [img('photo-1617038260897-41a1f14a8ca0', 1200), img('photo-1535632066927-ab7c9ab60908', 1200)],
    description: 'For connections and memories you want to keep without an ending.',
    sku: 'P2049-IC-INF01', stock: 27,
  },
];

export const DEFAULT_JOURNAL = [
  { id: 'article-1', title: 'How to build a bracelet around your story', category: 'Mix & Match', summary: 'Start with one memory, then layer symbols, colors and initials around it.', content: 'Every link can represent a person, a place or a milestone. Begin with the memory that matters most, then add supporting symbols and colors until the bracelet feels balanced and personal.', image: img('photo-1515562141207-7a88fb7ce338', 900), readTime: '3 min read' },
  { id: 'article-2', title: 'Gift guide: tiny objects with real meaning', category: 'Gift Guides', summary: 'A charm chosen for someone feels more personal than a generic accessory.', content: 'Letters, hearts, travel icons and favorite colors can turn a small gift into a memory the receiver keeps wearing.', image: img('photo-1513201099705-a9746e1e201f', 900), readTime: '4 min read' },
  { id: 'article-3', title: 'Ocean palette: silver, aqua and coral', category: 'Beach Vibes', summary: 'A fresh combination inspired by sunlight, clear water and summer evenings.', content: 'Mix cool silver links with aqua accents and one or two coral details. Leave some simple links empty so the colorful charms stand out.', image: img('photo-1507525428034-b723cf961d3e', 900), readTime: '5 min read' },
];

export const DEFAULT_FAQ = [
  { id: 'faq-1', question: 'What is an Italian Charm bracelet?', answer: 'Italian Charms are modular links that connect together to form a bracelet. You can change the order, replace links and keep adding new symbols over time.' },
  { id: 'faq-2', question: 'How do I attach or remove a charm?', answer: 'Hold two neighboring links, gently open the connector sideways, then hook or unhook the charm link. Work slowly to protect the finish.' },
  { id: 'faq-3', question: 'How long does delivery take?', answer: 'Most orders arrive within 1–5 business days depending on your location and shipping method.' },
  { id: 'faq-4', question: 'Can I exchange an item?', answer: 'Unused items in original condition can be requested for exchange within 7 days, subject to the store policy.' },
  { id: 'faq-5', question: 'How do I choose my bracelet size?', answer: 'Use the customizer to select a link count that matches your wrist. If you are between sizes, choose the larger option for a more relaxed fit.' },
];

export const DEFAULT_ABOUT = {
  kicker: 'ABOUT PISHNEEFO 2049',
  title: 'Memories deserve to travel with you.',
  storyTitle: 'Small symbols. Real stories.',
  storyText: 'Pishneefo 2049 turns small modular charms into personal keepsakes. Each link can stand for a person, a place, a milestone or a tiny moment worth keeping close.',
};

export const DEFAULT_SETTINGS = {
  storeName: 'Pishneefo 2049',
  tagline: 'Playful Italian charms for people, places and moments you want to keep close.',
  email: 'hello@pishneefo2049.com',
  phone: '09xx xxx xxx',
  address: 'Southeast Asia',
  announcement: 'FREE SHIPPING ON ORDERS OVER 500,000 VND · 7-DAY EXCHANGE',
  shippingFee: 30000,
  freeShippingThreshold: 500000,
  rates: [
    { code: 'VND', label: 'Vietnamese Dong', symbol: '₫', rateFromVND: 1, decimals: 0 },
    { code: 'THB', label: 'Thai Baht', symbol: '฿', rateFromVND: 0.00136538, decimals: 0 },
    { code: 'USD', label: 'US Dollar', symbol: '$', rateFromVND: 0.00003846, decimals: 2 },
    { code: 'LAK', label: 'Lao Kip', symbol: '₭', rateFromVND: 0.84615385, decimals: 0 },
  ],
  lowStockThreshold: 10,
};

export function seedProducts() {
  const now = new Date().toISOString();
  return CATALOG.map((c) => ({ ...c, active: true, createdAt: now, updatedAt: now }));
}

/* ───────────── ตัวสร้างคำสั่งซื้อตัวอย่าง (deterministic) ───────────── */

const FINISHES = [
  { id: 'gold', label: 'Sun Gold' }, { id: 'silver', label: 'Sea Silver' },
  { id: 'rose', label: 'Shell Rose' }, { id: 'aqua', label: 'Sky Prism' },
  { id: 'black', label: 'Deep Blue' }, { id: 'red', label: 'Coral Red' },
  { id: 'pink', label: 'Pearl Pink' }, { id: 'lilac', label: 'Soft Lilac' },
];
const FIRST = ['Somchai', 'Ploy', 'Nut', 'Fah', 'Mai', 'Bank', 'Ying', 'Tar', 'Bee', 'Nan', 'Gift', 'Oat'];
const LAST = ['Srisai', 'Chaiyo', 'Wong', 'Kittipong', 'Phumin', 'Aroon', 'Suk', 'Mala', 'Rattana', 'Boon'];
const CITIES = ['Bangkok', 'Chiang Mai', 'Phuket', 'Vientiane', 'Ho Chi Minh City', 'Khon Kaen', 'Da Nang', 'Luang Prabang'];
const CURRENCIES = ['THB', 'USD', 'VND', 'LAK'];

function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const int = (r, min, max) => min + Math.floor(r() * (max - min + 1));

export function seedOrders(count = 38) {
  const r = rng(20490819);
  const orders = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.pow(r(), 1.6) * 45);
    const created = new Date(today);
    created.setDate(created.getDate() - daysAgo);
    created.setHours(int(r, 8, 22), int(r, 0, 59), 0, 0);

    const lines = [];
    const lineCount = int(r, 1, 3);
    for (let j = 0; j < lineCount; j++) {
      if (r() < 0.28) {
        const finish = pick(r, FINISHES);
        const linkCount = pick(r, [14, 16, 18, 20]);
        const basePrice = 390000;
        const links = [];
        let charmsCost = 0;
        for (let k = 0; k < linkCount; k++) {
          if (r() < 0.32) {
            const charm = pick(r, CATALOG);
            charmsCost += charm.price;
            links.push({ position: k + 1, charmName: charm.name, charmSku: charm.sku, image: charm.image });
          } else {
            links.push({ position: k + 1, charmName: null });
          }
        }
        lines.push({
          id: `line-${i}-${j}`, type: 'custom-bracelet', name: 'Custom Italian Charm Bracelet',
          image: links.find((l) => l.image)?.image, quantity: 1, unitPrice: basePrice + charmsCost,
          bracelet: { finishId: finish.id, finishLabel: finish.label, linkCount, basePrice, links },
        });
      } else {
        const charm = pick(r, CATALOG);
        if (lines.some((l) => l.sku === charm.sku)) continue;
        lines.push({
          id: `line-${i}-${j}`, type: 'charm', name: charm.name, sku: charm.sku,
          image: charm.image, quantity: int(r, 1, 3), unitPrice: charm.price,
        });
      }
    }
    if (!lines.length) continue;

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const shipping = subtotal >= 500000 ? 0 : 30000;

    let status;
    const roll = r();
    if (daysAgo > 14) status = roll < 0.9 ? 'completed' : 'cancelled';
    else if (daysAgo > 6) status = roll < 0.62 ? 'completed' : roll < 0.9 ? 'shipped' : 'cancelled';
    else if (daysAgo > 2) status = roll < 0.45 ? 'shipped' : roll < 0.85 ? 'paid' : 'pending';
    else status = roll < 0.5 ? 'pending' : 'paid';

    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    orders.push({
      id: `order-${i}`,
      code: `P2049-${String(1000 + i).padStart(6, '0')}`,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
      status,
      customer: {
        firstName: first, lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
        phone: `0${int(r, 6, 9)}${int(r, 10000000, 99999999)}`,
        address: `${int(r, 1, 299)} ${pick(r, ['Sukhumvit', 'Rama IV', 'Nimman', 'Thonglor', 'Beach Rd'])} Rd.`,
        city: pick(r, CITIES),
        note: r() < 0.18 ? 'ห่อของขวัญให้ด้วยค่ะ' : undefined,
      },
      lines, subtotal, shipping, total: subtotal + shipping,
      payCurrency: pick(r, CURRENCIES),
      paymentMethod: 'Cash on delivery (COD)',
      internalNote: '',
    });
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
