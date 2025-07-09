// pages/api/match-list-items/reorder.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { listId, updates } = req.body

    if (!listId || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Paramètres manquants ou invalides' })
    }

    // Vérifier que l'utilisateur possède cette liste
    const list = await prisma.matchList.findFirst({
      where: {
        id: listId,
        userId: session.user.id
      }
    })

    if (!list) {
      return res.status(404).json({ error: 'Liste non trouvée ou non autorisée' })
    }

    // Vérifier que tous les items appartiennent à cette liste
    const itemIds = updates.map(update => update.itemId)
    const existingItems = await prisma.matchListItem.findMany({
      where: {
        id: { in: itemIds },
        listId: listId
      }
    })

    if (existingItems.length !== itemIds.length) {
      return res.status(400).json({ error: 'Certains items ne sont pas dans cette liste' })
    }

    // Mise à jour des positions en transaction
    await prisma.$transaction(
      updates.map(update => 
        prisma.matchListItem.update({
          where: { id: update.itemId },
          data: { position: update.position }
        })
      )
    )

    console.log(`✅ Ordre mis à jour pour ${updates.length} items dans la liste "${list.name}"`)

    return res.status(200).json({
      success: true,
      message: 'Ordre mis à jour avec succès !',
      updatedCount: updates.length
    })

  } catch (error: any) {
    console.error('❌ Erreur API reorder:', error)
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    })
  }
}