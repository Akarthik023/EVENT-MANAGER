// ═══════════════════════════════════════════════════════════
//  AK Event Planners — Backend Server
//  Handles booking form submissions and sends emails via Gmail
// ═══════════════════════════════════════════════════════════

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── Rate Limiter (max 5 booking requests per IP per 15 min) ─
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Please try again after 15 minutes.' }
});

// ── Nodemailer Transporter ──────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD   // Gmail App Password (16 chars)
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Mail transporter error:', error.message);
  } else {
    console.log('✅ Mail server is ready to send emails');
  }
});

// ── Helper: Build Owner Email HTML ─────────────────────────
function buildOwnerEmail({ name, phone, email, eventType, eventDate, guestCount, message }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Georgia', serif; background: #0a0a08; margin: 0; padding: 0; }
  .wrap { max-width: 620px; margin: 0 auto; background: #141210; border: 1px solid #C9A84C33; }
  .header { background: linear-gradient(135deg, #8B6914, #C9A84C); padding: 36px 40px; text-align: center; }
  .header h1 { color: #0a0a08; font-size: 1.4rem; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; font-weight: 600; }
  .header p { color: #0a0a08; font-size: 0.72rem; letter-spacing: 0.2em; margin: 8px 0 0; opacity: 0.75; text-transform: uppercase; }
  .body { padding: 38px 40px; }
  .section-title { font-size: 0.6rem; letter-spacing: 0.35em; text-transform: uppercase; color: #C9A84C; border-bottom: 1px solid #C9A84C33; padding-bottom: 8px; margin: 28px 0 18px; }
  .section-title:first-child { margin-top: 0; }
  .row { display: flex; margin-bottom: 12px; }
  .label { color: #8A8070; font-size: 0.75rem; min-width: 130px; font-weight: 400; }
  .value { color: #F5F0E8; font-size: 0.82rem; font-weight: 300; }
  .message-box { background: #0e0c09; border: 1px solid #C9A84C22; padding: 18px 20px; color: #EDE8DC; font-size: 0.82rem; line-height: 1.8; font-weight: 300; margin-top: 8px; }
  .footer { background: #0e0c09; padding: 22px 40px; text-align: center; border-top: 1px solid #C9A84C22; }
  .footer p { color: #8A8070; font-size: 0.65rem; letter-spacing: 0.1em; margin: 0; }
  .badge { display: inline-block; background: #C9A84C22; border: 1px solid #C9A84C44; color: #C9A84C; padding: 4px 14px; font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 2px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🎉 New Event Booking</h1>
    <p>AK Event Planners</p>
  </div>
  <div class="body">
    <div class="section-title">👤 Client Details</div>
    <div class="row"><span class="label">Full Name</span><span class="value">${name}</span></div>
    <div class="row"><span class="label">Phone Number</span><span class="value">${phone}</span></div>
    <div class="row"><span class="label">Email Address</span><span class="value"><a href="mailto:${email}" style="color:#C9A84C">${email}</a></span></div>

    <div class="section-title">🎊 Event Details</div>
    <div class="row"><span class="label">Event Type</span><span class="value"><span class="badge">${eventType}</span></span></div>
    <div class="row"><span class="label">Preferred Date</span><span class="value">${eventDate || 'Not specified'}</span></div>
    <div class="row"><span class="label">Guest Count</span><span class="value">${guestCount || 'Not specified'}</span></div>

    <div class="section-title">💬 Message / Special Requests</div>
    <div class="message-box">${message || 'No additional message provided.'}</div>
  </div>
  <div class="footer">
    <p>Reply to this email or contact the client at <strong style="color:#C9A84C">${email}</strong></p>
    <p style="margin-top:6px">Please respond within 24 hours ✦ AK Event Planners</p>
  </div>
</div>
</body>
</html>`;
}

// ── Helper: Build Client Confirmation Email HTML ────────────
function buildClientEmail({ name, eventType, eventDate, guestCount }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'Georgia', serif; background: #0a0a08; margin: 0; padding: 0; }
  .wrap { max-width: 620px; margin: 0 auto; background: #141210; border: 1px solid #C9A84C33; }
  .header { background: linear-gradient(135deg, #8B6914, #C9A84C); padding: 40px; text-align: center; }
  .header h1 { color: #0a0a08; font-size: 1.5rem; letter-spacing: 0.15em; margin: 0 0 8px; font-weight: 600; }
  .header p { color: #0a0a08; font-size: 0.72rem; letter-spacing: 0.2em; margin: 0; opacity: 0.75; text-transform: uppercase; }
  .body { padding: 40px; text-align: center; }
  .greeting { font-family: 'Georgia', serif; font-size: 1.5rem; color: #F5F0E8; font-weight: 300; margin-bottom: 14px; }
  .greeting em { color: #C9A84C; font-style: italic; }
  .text { color: #8A8070; font-size: 0.82rem; line-height: 1.9; font-weight: 300; max-width: 440px; margin: 0 auto 28px; }
  .summary { background: #0e0c09; border: 1px solid #C9A84C22; padding: 24px 28px; text-align: left; margin-bottom: 28px; }
  .sum-row { display: flex; margin-bottom: 10px; }
  .sum-label { color: #8A8070; font-size: 0.72rem; min-width: 120px; }
  .sum-value { color: #E8D5A3; font-size: 0.78rem; }
  .divider { width: 60px; height: 1px; background: linear-gradient(to right, transparent, #C9A84C, transparent); margin: 0 auto 24px; }
  .footer { background: #0e0c09; padding: 22px 40px; text-align: center; border-top: 1px solid #C9A84C22; }
  .footer p { color: #8A8070; font-size: 0.63rem; letter-spacing: 0.08em; margin: 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Booking Received ✦</h1>
    <p>AK Event Planners</p>
  </div>
  <div class="body">
    <p class="greeting">Thank you, <em>${name}</em>!</p>
    <div class="divider"></div>
    <p class="text">We've received your booking request and our team is already excited to start planning your <strong style="color:#C9A84C">${eventType}</strong>. We will contact you within 24 hours to discuss the details.</p>

    <div class="summary">
      <div class="sum-row"><span class="sum-label">Event</span><span class="sum-value">${eventType}</span></div>
      <div class="sum-row"><span class="sum-label">Date</span><span class="sum-value">${eventDate || 'To be confirmed'}</span></div>
      <div class="sum-row"><span class="sum-label">Guests</span><span class="sum-value">${guestCount || 'To be confirmed'}</span></div>
    </div>

    <p class="text" style="font-size:0.75rem">Questions? Reach us at <a href="mailto:kartheebanaravindhan@gmail.com" style="color:#C9A84C">kartheebanaravindhan@gmail.com</a></p>
  </div>
  <div class="footer">
    <p>✦ Crafting Unforgettable Moments ✦</p>
    <p style="margin-top:6px">© 2025 AK Event Planners. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
}

// ── POST /api/book — Main Booking Endpoint ──────────────────
app.post('/api/book', bookingLimiter, async (req, res) => {
  try {
    const { name, phone, email, eventType, eventDate, guestCount, message } = req.body;

    // ── Server-side validation ──
    if (!name || !phone || !email || !eventType) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!/^[\d\s\+\-\(\)]{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
    }

    const data = { name, phone, email, eventType, eventDate, guestCount, message };

    // ── Email 1: Notify owner ──
    await transporter.sendMail({
      from:    `"AK Event Planners" <${process.env.GMAIL_USER}>`,
      to:      process.env.OWNER_EMAIL,
      replyTo: email,
      subject: `🎉 New Booking – ${eventType} | ${name}`,
      html:    buildOwnerEmail(data)
    });

    // ── Email 2: Confirm to client ──
    await transporter.sendMail({
      from:    `"AK Event Planners" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: `✦ Booking Confirmed — AK Event Planners`,
      html:    buildClientEmail(data)
    });

    console.log(`✅ Booking received: ${name} | ${eventType} | ${email}`);
    return res.status(200).json({
      success: true,
      message: `Booking confirmed! A confirmation has been sent to ${email}.`
    });

  } catch (error) {
    console.error('❌ Booking error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong sending the email. Please try again or contact us directly.'
    });
  }
});

// ── GET /api/health — Health check ─────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Catch-all: serve index.html for any unknown route ───────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AK Event Planners running at http://localhost:${PORT}`);
  console.log(`📧 Booking emails → ${process.env.OWNER_EMAIL || 'kartheebanaravindhan@gmail.com'}\n`);
});
