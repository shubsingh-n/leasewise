import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const sendTelegramMessage = async (text: string) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram credentials missing. Message not sent:', text);
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            console.error('Telegram API Error Details:', parsed);
            reject(new Error(`Telegram API error: ${res.statusCode} - ${parsed.description || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Telegram response: ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Telegram Network Error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

export const testTelegramConnection = async () => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('Telegram credentials (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID) are missing in the server .env file.');
  }
  
  const testMessage = `
<b>✅ Telegram Integration Check</b>
Time: ${new Date().toLocaleString('en-IN')}
Status: Configuration matches!
  `.trim();
  
  return await sendTelegramMessage(testMessage);
};

export const formatContactRequestMessage = (data: {
  requesterName: string;
  requesterPhone: string;
  listingTitle: string;
  ownerName: string;
  ownerPhone: string;
}) => {
  const { requesterName, requesterPhone, listingTitle, ownerName, ownerPhone } = data;
  
  // Clean owner phone for WhatsApp link
  const cleanPhone = ownerPhone.replace(/[^\d]/g, '');
  
  const whatsappMessage = encodeURIComponent(
    `Hi ${ownerName}, I'm the admin of the rental platform. A user named ${requesterName} (${requesterPhone}) is interested in your listing: "${listingTitle}". Please reach out to them!`
  );
  
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;

  return `
<b>🚀 New Lead Received!</b>

👤 <b>Requester:</b> ${requesterName}
📱 <b>Phone:</b> ${requesterPhone}
🏠 <b>Listing:</b> ${listingTitle}
👤 <b>Owner:</b> ${ownerName}

<a href="${whatsappLink}">👉 Send WhatsApp to Owner</a>
  `.trim();
};
