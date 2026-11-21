import crypto from 'crypto';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'vigilant-citron-gwjrd';
const DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'solvapact-db';
const ALLOWED_OWNER_EMAILS = ['solvapact.vercel.app@gmail.com', 'hugolaumonier@gmail.com'];

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < cachedCerts.expiresAt) return cachedCerts.certs;
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    { signal: AbortSignal.timeout(6000) }
  );
  if (!resp.ok) throw new Error('Unable to fetch Firebase certificates');
  const certs = (await resp.json()) as Record<string, string>;
  cachedCerts = { certs, expiresAt: now + 3600_000 };
  return certs;
}

async function verifyBearerToken(authHeader?: string) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const m = authHeader.match(/^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/);
  if (!m) return null;
  const token = m[1];
  const [h, p, s] = token.split('.');
  try {
    const header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8')) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as {
      iss?: string;
      aud?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;
    const certs = await getGoogleCerts();
    const pem = certs[header.kid];
    if (!pem) return null;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${h}.${p}`);
    verifier.end();
    if (!verifier.verify(pem, Buffer.from(s, 'base64url'))) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      payload.aud !== PROJECT_ID ||
      payload.iss !== `https://securetoken.google.com/${PROJECT_ID}` ||
      typeof payload.sub !== 'string' ||
      !payload.sub.trim() ||
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSec ||
      typeof payload.iat !== 'number' ||
      payload.iat > nowSec + 300
    ) {
      return null;
    }
    return {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      emailVerified: Boolean(payload.email_verified),
      token,
    };
  } catch {
    return null;
  }
}

async function fetchUserLoyalty(user: {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  token: string;
}) {
  const isOwner =
    user.emailVerified &&
    Boolean(user.email && ALLOWED_OWNER_EMAILS.includes(user.email.trim().toLowerCase()));
  const fallback = isOwner
    ? { loyaltyActive: true, loyaltyExp: 120, diamondPublicationsCount: 0 }
    : { loyaltyActive: false, loyaltyExp: 0, diamondPublicationsCount: 0 };
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      PROJECT_ID
    )}/databases/${encodeURIComponent(DATABASE_ID)}/documents/users/${encodeURIComponent(user.uid)}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return fallback;
    const doc = (await resp.json()) as {
      fields?: {
        loyaltyActive?: { booleanValue?: boolean };
        loyaltyExp?: { integerValue?: string; doubleValue?: number };
        diamondPublicationsCount?: { integerValue?: string; doubleValue?: number };
      };
    };
    const f = doc.fields || {};
    const exp = Math.max(0, Number(f.loyaltyExp?.integerValue ?? f.loyaltyExp?.doubleValue ?? 0) || 0);
    return {
      loyaltyActive: Boolean(f.loyaltyActive?.booleanValue) || isOwner,
      loyaltyExp: isOwner ? Math.max(120, exp) : exp,
      diamondPublicationsCount: Math.max(
        0,
        Number(
          f.diamondPublicationsCount?.integerValue ??
            f.diamondPublicationsCount?.doubleValue ??
            0
        ) || 0
      ),
    };
  } catch {
    return fallback;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const verifiedUser = await verifyBearerToken(req.headers?.authorization);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentification requise pour initier un paiement.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { kind } = body as {
    kind?: 'publication' | 'loyalty';
  };

  if (kind !== 'publication' && kind !== 'loyalty') {
    return res.status(400).json({ error: 'Type de paiement invalide.' });
  }

  const basePrice = 29.99;
  let authoritativeAmount = 39.99;

  if (kind !== 'loyalty') {
    const serverLoyalty = await fetchUserLoyalty(verifiedUser);
    const exp = serverLoyalty.loyaltyExp;
    const isActive = serverLoyalty.loyaltyActive;
    const isPromoPeriod =
      String(process.env.PROMO_PERIOD_ACTIVE || process.env.VITE_PROMO_PERIOD_ACTIVE || '').toLowerCase() ===
      'true';

    let discountPct = 0;
    if (isActive) {
      if (exp >= 120) discountPct = isPromoPeriod ? 50 : 35;
      else if (exp >= 60) discountPct = isPromoPeriod ? 30 : 23;
      else if (exp >= 30) discountPct = isPromoPeriod ? 22 : 17;
      else discountPct = isPromoPeriod ? 15 : 10;
    }
    authoritativeAmount = Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.APP_URL || 'https://solvapact.vercel.app';
  if (stripeSecret && stripeSecret.startsWith('sk_')) {
    try {
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('success_url', `${appUrl}/?payment=success&session_id={CHECKOUT_SESSION_ID}`);
      params.append('cancel_url', `${appUrl}/?payment=cancel`);
      params.append('line_items[0][price_data][currency]', 'eur');
      params.append(
        'line_items[0][price_data][product_data][name]',
        kind === 'loyalty' ? 'Compte Fidélité SolvaPact' : 'Publication dossier SolvaPact'
      );
      params.append(
        'line_items[0][price_data][unit_amount]',
        String(Math.round(authoritativeAmount * 100))
      );
      params.append('line_items[0][quantity]', '1');
      if (verifiedUser.email) params.append('customer_email', verifiedUser.email);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: AbortSignal.timeout(8000),
      });
      const stripeJson = (await stripeRes.json()) as { id?: string; url?: string };
      if (stripeRes.ok && stripeJson.url) {
        return res.json({
          mode: 'stripe',
          checkoutUrl: stripeJson.url,
          sessionId: stripeJson.id,
          verifiedAmount: authoritativeAmount,
        });
      }
    } catch (err) {
      console.warn('Vercel Stripe checkout fallback:', err);
    }
  }

  return res.json({
    mode: 'sandbox_verified',
    verifiedAmount: authoritativeAmount,
    transactionId: `SP-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
  });
}
