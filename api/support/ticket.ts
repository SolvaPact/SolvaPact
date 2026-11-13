export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsedBody =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const { name, email, message } = parsedBody as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Nom, e-mail et message sont requis.' });
    }

    const ticketId = `SP-SUP-${Math.floor(10000 + Math.random() * 90000)}`;
    return res.json({
      ok: true,
      ticketId,
      recipientEmail: 'solvapact.vercel.app@gmail.com',
    });
  } catch (error) {
    console.error('Support ticket error:', error);
    return res.status(500).json({ error: 'Erreur lors du traitement de la demande.' });
  }
}
