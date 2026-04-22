import cron from 'node-cron';
import Property from '../models/Property.js';
import FlatmateRequirement from '../models/FlatmateRequirement.js';
import { sendTelegramMessage } from './telegram.service.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const EXPIRE_DAYS = 10;
const NOTIFY_HOURS_BEFORE = 24;

export const generateReactivateToken = (id: string, currentExpiresAt: Date) => {
  const secret = process.env.JWT_SECRET || 'secret';
  return crypto.createHmac('sha256', secret)
    .update(id + currentExpiresAt.getTime().toString())
    .digest('hex')
    .substring(0, 16);
};

export const initExpirationCron = () => {
  // Run every 12 hours: 0 0,12 * * *
  cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron] Running expiration and notification check...');
    await runExpirationLogic();
  });
  
  // Run once on startup after a short delay
  setTimeout(async () => {
    console.log('[Startup] Running initial expiration and notification check...');
    await runExpirationLogic();
  }, 5000);
};

async function runExpirationLogic() {
  try {
    await migrateMissingExpiresAt();
    await checkExpiringSoon();
    await checkExpired();
  } catch (error) {
    console.error('Error in expiration logic:', error);
  }
}

async function migrateMissingExpiresAt() {
  const approvedProps = await Property.find({ status: 'approved', expiresAt: { $exists: false } });
  for (const p of approvedProps) {
    const expiresAt = new Date(p.createdAt);
    expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);
    p.expiresAt = expiresAt;
    await p.save();
  }

  const approvedReqs = await FlatmateRequirement.find({ status: 'approved', expiresAt: { $exists: false } });
  for (const r of approvedReqs) {
    const expiresAt = new Date(r.createdAt);
    expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);
    r.expiresAt = expiresAt;
    await r.save();
  }
}

async function checkExpiringSoon() {
  const now = new Date();
  const threshold = new Date(now.getTime() + (NOTIFY_HOURS_BEFORE * 60 * 60 * 1000));

  // Find listings expiring within 24 hours that haven't been notified yet
  const props = await Property.find({
    status: 'approved',
    expiresAt: { $lte: threshold, $gt: now },
    $or: [
      { lastNotifiedAt: { $exists: false } },
      { lastNotifiedAt: { $lt: new Date(now.getTime() - (24 * 60 * 60 * 1000)) } } // Prevent double notification
    ]
  });

  for (const p of props) {
    await notifyAdmin(p, 'property');
    p.lastNotifiedAt = new Date();
    await p.save();
  }

  const reqs = await FlatmateRequirement.find({
    status: 'approved',
    expiresAt: { $lte: threshold, $gt: now },
    $or: [
      { lastNotifiedAt: { $exists: false } },
      { lastNotifiedAt: { $lt: new Date(now.getTime() - (24 * 60 * 60 * 1000)) } }
    ]
  });

  for (const r of reqs) {
    await notifyAdmin(r, 'flatmate');
    r.lastNotifiedAt = new Date();
    await r.save();
  }
}

async function checkExpired() {
  const now = new Date();
  
  const resProps = await Property.updateMany(
    { status: 'approved', expiresAt: { $lte: now } },
    { status: 'fulfilled' }
  );
  if (resProps.modifiedCount > 0) console.log(`Marked ${resProps.modifiedCount} properties as fulfilled.`);

  const resReqs = await FlatmateRequirement.updateMany(
    { status: 'approved', expiresAt: { $lte: now } },
    { status: 'fulfilled' }
  );
  if (resReqs.modifiedCount > 0) console.log(`Marked ${resReqs.modifiedCount} flatmate requirements as fulfilled.`);
}

export async function notifyAdmin(item: any, type: 'property' | 'flatmate') {
  const title = type === 'property' ? item.title : `Flatmate Request from ${item.name}`;
  const ownerName = type === 'property' ? item.contact.name : item.name;
  const ownerPhone = (type === 'property' ? item.contact?.whatsapp : item.contact?.whatsapp) || '';
  const cleanPhone = ownerPhone.replace(/[^\d]/g, '');
  
  const whatsappMsg = encodeURIComponent(
    `Your listing "${title}" will expire in 24 hours. Please reply 'fulfilled' if it is rented, or 'unfulfilled' if you want to keep it active for 10 more days.`
  );
  const whatsappLink = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${whatsappMsg}`;
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const token = generateReactivateToken(item._id.toString(), item.expiresAt);
  const reactivateLink = `${backendUrl}/api/admin/listings/reactivate-public/${type}/${item._id}?token=${token}`;

  const message = `
<b>⚠️ Listing Expiring Soon!</b>

🏠 <b>Listing:</b> ${title}
👤 <b>Owner:</b> ${ownerName}
📅 <b>Expires:</b> ${item.expiresAt.toLocaleString('en-IN')}

<a href="${whatsappLink}">👉 Message Owner on WhatsApp</a>

<b>✅ Reactivate for 10 Days (Copy & paste the link below in your browser):</b>
${reactivateLink}
  `.trim();

  try {
    await sendTelegramMessage(message);
  } catch (err) {
    console.error('Failed to send expiration notification to Telegram:', err);
  }
}
