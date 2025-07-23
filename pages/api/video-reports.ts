export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  try {
    const { suggestionId, reason, comment } = req.body

    const validReasons = ['spam', 'inappropriate', 'broken_link', 'duplicate', 'other']
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Raison invalide' })
    }

    // Vérifier si déjà signalé
    const existingReport = await prisma.videoReport.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId
        }
      }
    })

    if (existingReport) {
      return res.status(400).json({ error: 'Vous avez déjà signalé cette vidéo' })
    }

    // Créer le signalement
    await prisma.videoReport.create({
      data: {
        userId: session.user.id,
        suggestionId,
        reason,
        comment: comment?.trim() || null
      }
    })

    // Si plus de 3 signalements, bloquer automatiquement
    const totalReports = await prisma.videoReport.count({
      where: {
        suggestionId,
        isResolved: false
      }
    })

    if (totalReports >= 3) {
      await prisma.videoSuggestion.update({
        where: { id: suggestionId },
        data: { isBlocked: true }
      })
      
      console.log(`🚨 Suggestion ${suggestionId} automatiquement bloquée (${totalReports} signalements)`)
    }

    res.status(200).json({
      success: true,
      message: 'Signalement envoyé'
    })

  } catch (error) {
    console.error('❌ Erreur signalement:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    })
  }
}