// pages/api/match-list-items.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }

    if (req.method === 'POST') {
      const { action, listId, matchId, note, position } = req.body

      if (!action || !listId || !matchId) {
        return res.status(400).json({ error: 'Paramètres manquants' })
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

      // Vérifier que le match existe
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: {
          id: true,
          homeTeam: true,
          awayTeam: true,
          competition: true,
          date: true,
          sport: true
        }
      })

      if (!match) {
        return res.status(404).json({ error: 'Match non trouvé' })
      }

      if (action === 'add') {
        // Vérifier si le match n'est pas déjà dans la liste
        const existingItem = await prisma.matchListItem.findFirst({
          where: {
            listId,
            matchId
          }
        })

        if (existingItem) {
          return res.status(400).json({ error: 'Ce match est déjà dans cette liste' })
        }

        // Obtenir la prochaine position si pas spécifiée
        let finalPosition = position
        if (finalPosition === undefined) {
          const lastItem = await prisma.matchListItem.findFirst({
            where: { listId },
            orderBy: { position: 'desc' }
          })
          finalPosition = (lastItem?.position || 0) + 1
        }

        const newItem = await prisma.matchListItem.create({
          data: {
            listId,
            matchId,
            note: note?.trim() || null,
            position: finalPosition
          }
        })

        return res.status(201).json({
          success: true,
          message: `"${match.homeTeam} vs ${match.awayTeam}" ajouté à "${list.name}" ! ⭐`,
          item: {
            id: newItem.id,
            note: newItem.note,
            position: newItem.position,
            addedAt: newItem.addedAt,
            match
          }
        })

      } else if (action === 'remove') {
        const existingItem = await prisma.matchListItem.findFirst({
          where: {
            listId,
            matchId
          }
        })

        if (!existingItem) {
          return res.status(400).json({ error: 'Ce match n\'est pas dans cette liste' })
        }

        await prisma.matchListItem.delete({
          where: { id: existingItem.id }
        })

        return res.status(200).json({
          success: true,
          message: `"${match.homeTeam} vs ${match.awayTeam}" retiré de "${list.name}"`,
          removedItemId: existingItem.id
        })

      } else if (action === 'update') {
        const existingItem = await prisma.matchListItem.findFirst({
          where: {
            listId,
            matchId
          }
        })

        if (!existingItem) {
          return res.status(404).json({ error: 'Match non trouvé dans cette liste' })
        }

        const updateData: any = {}
        if (note !== undefined) updateData.note = note?.trim() || null
        if (position !== undefined) updateData.position = position

        const updatedItem = await prisma.matchListItem.update({
          where: { id: existingItem.id },
          data: updateData
        })

        return res.status(200).json({
          success: true,
          message: 'Match mis à jour dans la liste ! ✅',
          item: {
            id: updatedItem.id,
            note: updatedItem.note,
            position: updatedItem.position,
            addedAt: updatedItem.addedAt,
            match
          }
        })

      } else {
        return res.status(400).json({ error: 'Action non supportée' })
      }

    } else if (req.method === 'GET') {
      const { listId } = req.query

      if (!listId) {
        return res.status(400).json({ error: 'ID de la liste manquant' })
      }

      // Vérifier l'accès à la liste
      const list = await prisma.matchList.findFirst({
        where: {
          id: listId as string,
          OR: [
            { userId: session.user.id }, // Propriétaire
            { isPublic: true }           // Ou liste publique
          ]
        }
      })

      if (!list) {
        return res.status(404).json({ error: 'Liste non trouvée ou privée' })
      }

      const items = await prisma.matchListItem.findMany({
        where: { listId: listId as string },
        include: {
          match: {
            select: {
              id: true,
              homeTeam: true,
              awayTeam: true,
              homeScore: true,
              awayScore: true,
              date: true,
              competition: true,
              sport: true,
              venue: true,
              homeTeamLogo: true,
              awayTeamLogo: true,
              avgRating: true,
              totalRatings: true
            }
          }
        },
        orderBy: { position: 'asc' }
      })

      return res.status(200).json({
        success: true,
        list: {
          id: list.id,
          name: list.name,
          description: list.description,
          isPublic: list.isPublic,
          color: list.color,
          emoji: list.emoji,
          isOwner: list.userId === session.user.id
        },
        items: items.map(item => ({
          id: item.id,
          note: item.note,
          position: item.position,
          addedAt: item.addedAt,
          match: item.match
        }))
      })

    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (error: any) {
    console.error('❌ Erreur API match-list-items:', error)
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    })
  }
}