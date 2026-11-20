export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { kind, loyaltyActive, loyaltyExp, diamondPublicationsCount, userEmail } = body as {
    kind?: 'publication' | 'loyalty';
    loyaltyActive?: boolean;
    loyaltyExp?: number;
    diamondPublicationsCount?: number;
    userEmail?: string;
  };

  const basePrice = 29.99;
  let authoritativeAmount = 80;

  if (kind !== 'loyalty') {
    const exp = Number(loyaltyExp) || 0;
    const isActive = Boolean(loyaltyActive);
    const count = Math.max(0, Number(diamondPublicationsCount) || 0);
    let discountPct = 0;
    if (isActive) {
      if (exp >= 500) discountPct = 45;
      else if (exp >= 300) discountPct = 23;
      else if (exp >= 150) discountPct = 17;
      else if (exp >= 50) discountPct = 10;
    }
    const isFree5th = isActive && exp >= 500 && (count + 1) % 5 === 0;
    authoritativeAmount = isFree5th
      ? 0
      : Math.round(basePrice * (1 - discountPct / 100) * 100) / 100;
  }

  if (authoritativeAmount === 0) {
    return res.json({
      mode: 'diamond_free',
      verifiedAmount: 0,
      transactionId: `SP-DIAMOND-FREE-${Date.now()}`,
    });
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
      if (userEmail) params.append('customer_email', userEmail);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
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
