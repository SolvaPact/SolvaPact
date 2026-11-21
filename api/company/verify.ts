export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const rawCountry = typeof req.query?.country === 'string' ? req.query.country.trim().toUpperCase() : 'MG';
  const country = rawCountry === 'FR' ? 'FR' : 'MG';

  if (!q || q.length < 3 || q.length > 100) {
    return res
      .status(400)
      .json({ error: 'Saisissez un NIF/STAT malgache ou un SIREN/nom de société (3 à 100 caractères).' });
  }

  const digitsOnly = q.replace(/\s+/g, '');
  if (country === 'MG' && /^\d{10,17}$/.test(digitsOnly)) {
    return res.json({
      results: [
        {
          registryType: 'NIF_STAT_MG',
          identifier: digitsOnly,
          legalName: `Entreprise immatriculée Madagascar (${digitsOnly.length === 10 ? 'NIF' : 'STAT'} ${digitsOnly})`,
          legalForm: 'Société / Entreprise Madagascar',
          city: 'Madagascar',
          activity: 'Contrôle format NIF/STAT valide (Direction Générale des Impôts / INSTAT)',
        },
      ],
    });
  }

  try {
    const apiRes = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&per_page=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!apiRes.ok) {
      return res.json({ results: [] });
    }
    const data = (await apiRes.json()) as {
      results?: Array<{
        siren?: string;
        nom_complet?: string;
        nature_juridique?: string;
        siege?: { commune?: string; libelle_commune?: string };
        activite_principale?: string;
      }>;
    };
    const formatted = (data.results || []).map((item) => ({
      registryType: 'INSEE_FR',
      identifier: item.siren || q,
      legalName: item.nom_complet || 'Entreprise vérifiée',
      legalForm: item.nature_juridique || 'Société',
      city: item.siege?.libelle_commune || item.siege?.commune || 'France',
      activity: item.activite_principale || '',
    }));
    return res.json({ results: formatted });
  } catch {
    return res.json({ results: [] });
  }
}
