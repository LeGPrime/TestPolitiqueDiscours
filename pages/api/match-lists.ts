// pages/api/match-lists.ts
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

    if (req.method === 'GET') {
      const { userId, public: publicOnly } = req.query

      const targetUserId = userId as string || session.user.id
      const isOwnProfile = targetUserId === session.user.id

      // Construire les filtres
      const whereClause: any = {
        userId: targetUserId
      }

      // Si ce n'est pas son propre profil, ne montrer que les listes publiques
      if (!isOwnProfile || publicOnly === 'true') {
        whereClause.isPublic = true
      }

      const lists = await prisma.matchList.findMany({
        where: whereClause,
        include: {
          matches: {
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
          },
          _count: {
            select: {
              matches: true,
              likes: true
            }
          },
          likes: isOwnProfile ? undefined : {
            where: { userId: session.user.id },
            select: { id: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      const formattedLists = lists.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPublic: list.isPublic,
        color: list.color,
        emoji: list.emoji,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        matchCount: list._count.matches,
        likesCount: list._count.likes,
        isLiked: !isOwnProfile ? list.likes.length > 0 : false,
        matches: list.matches.slice(0, 4).map(item => ({ // Preview des 4 premiers matchs
          id: item.id,
          note: item.note,
          position: item.position,
          addedAt: item.addedAt,
          match: item.match
        })),
        isOwner: targetUserId === session.user.id
      }))

      return res.status(200).json({ 
        success: true, 
        lists: formattedLists 
      })

    } else if (req.method === 'POST') {
      const { name, description, isPublic = true, color, emoji } = req.body

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Le nom de la liste est obligatoire' })
      }

      if (name.length > 100) {
        return res.status(400).json({ error: 'Le nom ne peut pas dépasser 100 caractères' })
      }

      if (description && description.length > 500) {
        return res.status(400).json({ error: 'La description ne peut pas dépasser 500 caractères' })
      }

      // Vérifier que l'utilisateur n'a pas déjà une liste avec ce nom
      const existingList = await prisma.matchList.findFirst({
        where: {
          userId: session.user.id,
          name: name.trim()
        }
      })

      if (existingList) {
        return res.status(400).json({ error: 'Vous avez déjà une liste avec ce nom' })
      }

      const newList = await prisma.matchList.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          userId: session.user.id,
          isPublic: Boolean(isPublic),
          color: color || null,
          emoji: emoji || null
        },
        include: {
          _count: {
            select: {
              matches: true,
              likes: true
            }
          }
        }
      })

      return res.status(201).json({
        success: true,
        message: `Liste "${newList.name}" créée avec succès ! 📝`,
        list: {
          id: newList.id,
          name: newList.name,
          description: newList.description,
          isPublic: newList.isPublic,
          color: newList.color,
          emoji: newList.emoji,
          createdAt: newList.createdAt,
          updatedAt: newList.updatedAt,
          matchCount: 0,
          likesCount: 0,
          matches: [],
          isOwner: true
        }
      })

    } else if (req.method === 'PUT') {
      const { listId, name, description, isPublic, color, emoji } = req.body

      if (!listId) {
        return res.status(400).json({ error: 'ID de la liste manquant' })
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

      const updateData: any = {}

      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          return res.status(400).json({ error: 'Le nom de la liste est obligatoire' })
        }
        if (name.length > 100) {
          return res.status(400).json({ error: 'Le nom ne peut pas dépasser 100 caractères' })
        }

        // Vérifier l'unicité du nom (sauf pour la liste actuelle)
        if (name.trim() !== list.name) {
          const existingList = await prisma.matchList.findFirst({
            where: {
              userId: session.user.id,
              name: name.trim(),
              id: { not: listId }
            }
          })

          if (existingList) {
            return res.status(400).json({ error: 'Vous avez déjà une liste avec ce nom' })
          }
        }

        updateData.name = name.trim()
      }

      if (description !== undefined) {
        if (description && description.length > 500) {
          return res.status(400).json({ error: 'La description ne peut pas dépasser 500 caractères' })
        }
        updateData.description = description?.trim() || null
      }

      if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic)
      if (color !== undefined) updateData.color = color || null
      if (emoji !== undefined) updateData.emoji = emoji || null

      const updatedList = await prisma.matchList.update({
        where: { id: listId },
        data: updateData,
        include: {
          _count: {
            select: {
              matches: true,
              likes: true
            }
          }
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Liste mise à jour avec succès ! ✅',
        list: {
          id: updatedList.id,
          name: updatedList.name,
          description: updatedList.description,
          isPublic: updatedList.isPublic,
          color: updatedList.color,
          emoji: updatedList.emoji,
          createdAt: updatedList.createdAt,
          updatedAt: updatedList.updatedAt,
          matchCount: updatedList._count.matches,
          likesCount: updatedList._count.likes,
          isOwner: true
        }
      })

    } else if (req.method === 'DELETE') {
      const { listId } = req.query

      if (!listId) {
        return res.status(400).json({ error: 'ID de la liste manquant' })
      }

      // Vérifier que l'utilisateur possède cette liste
      const list = await prisma.matchList.findFirst({
        where: {
          id: listId as string,
          userId: session.user.id
        },
        include: {
          _count: {
            select: { matches: true }
          }
        }
      })

      if (!list) {
        return res.status(404).json({ error: 'Liste non trouvée ou non autorisée' })
      }

      await prisma.matchList.delete({
        where: { id: listId as string }
      })

      return res.status(200).json({
        success: true,
        message: `Liste "${list.name}" supprimée avec succès (${list._count.matches} matchs)`,
        deletedListId: listId
      })

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }

  } catch (error: any) {
    console.error('❌ Erreur API match-lists:', error)
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    })
  }
}