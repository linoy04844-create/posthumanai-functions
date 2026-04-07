const crypto = require('crypto');

const RESEND_API_KEY = process.env.SENDGRID_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SITE_URL = 'https://posthumanai.net';

function generatePassword() {
  return 'pH' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function saveMember(email, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/members`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ email: email.toLowerCase(), password })
  });
  return res.ok;
}

async function sendWelcomeEmail(email, name, password) {
  const body = {
    from: 'Linoy pH.Ai <onboarding@resend.dev>',
    to: [email],
    subject: 'Welcome to pH.Ai Prompts Your Access Details',
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1a1917;">
        <div style="border-bottom: 1px solid #d0cec9; padding-bottom: 24px; margin-bottom: 24px;">
          <p style="font-family: monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #9c9890; margin: 0;">pH.Ai post.human.ai</p>
        </div>
        <h1 style="font-size: 32px; letter-spacing: 2px; margin: 0 0 8px;">You're in.</h1>
        <p style="font-style: italic; color: #9c9890; font-size: 18px; margin: 0 0 32px;">Welcome to pH.Ai Prompts${name ? ', ' + name : ''}.</p>
        <p style="font-size: 15px; line-height: 1.9; color: #9c9890; margin-bottom: 32px;">Your prompt library is ready — advanced AI prompts organized by category, tested on real content, built to produce images that look like studio photography. Not AI-looking. Real.</p>
        <div style="border: 0.5px solid #d0cec9; padding: 24px; margin-bottom: 32px;">
          <p style="font-family: monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #9c9890; margin: 0 0 16px;">Your Access Details</p>
          <p style="margin: 0 0 8px; font-size: 15px;">Go to: <a href="${SITE_URL}/signin.html" style="color: #1a1917;">${SITE_URL}/signin.html</a></p>
          <p style="margin: 0 0 8px; font-size: 15px;">Email: <strong>${email}</strong></p>
          <p style="margin: 0; font-size: 15px;">Password: <strong style="font-family: monospace; font-size: 16px; letter-spacing: 2px;">${password}</strong></p>
        </div>
        <p style="font-size: 13px; color: #9c9890; font-style: italic; margin-bottom: 32px;">New prompts are added every month.</p>
        <div style="border-top: 0.5px solid #d0cec9; padding-top: 24px;">
          <p style="font-family: monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #9c9890; margin: 0;">Linoy Winer pH.Ai @POST.HUMAN.AI</p>
        </div>
      </div>
    `
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();
  console.log('Resend response:', JSON.stringify(result));
  return response.ok;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = new URLSearchParams(event.body);
    const email = params.get('email');
    const name = params.get('full_name') || '';
    const saleId = params.get('sale_id');

    if (!email || !saleId) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const password = generatePassword();
    await saveMember(email, password);
    await sendWelcomeEmail(email, name, password);

    console.log(`New member: ${email} | Password: ${password}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
