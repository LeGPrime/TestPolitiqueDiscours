// pages/api/cleanup-f1-duplicates.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🧹 Nettoyage des doublons F1...')
    
    // 1. Récupérer tous les matchs F1
    const f1Matches = await prisma.match.findMany({
      where: { sport: 'F1' },
      orderBy: { createdAt: 'asc' } // Garder les plus anciens
    })

    console.log(`📊 ${f1Matches.length} matchs F1 trouvés`)

    // 2. Grouper par nom de GP + circuit + saison
    const matchGroups = new Map<string, any[]>()
    
    f1Matches.forEach(match => {
      const key = `${match.homeTeam}_${match.awayTeam}_${match.season}`
      if (!matchGroups.has(key)) {
        matchGroups.set(key, [])
      }
      matchGroups.get(key)!.push(match)
    })

    // 3. Identifier et supprimer les doublons
    let duplicatesFound = 0
    let duplicatesDeleted = 0
    const toDelete: string[] = []

    matchGroups.forEach((matches, key) => {
      if (matches.length > 1) {
        console.log(`🔍 Doublon trouvé: ${key} (${matches.length} exemplaires)`)
        duplicatesFound += matches.length - 1
        
        // Garder le premier (plus ancien), supprimer les autres
        const toKeep = matches[0]
        const toRemove = matches.slice(1)
        
        toRemove.forEach(match => {
          toDelete.push(match.id)
          console.log(`   ❌ À supprimer: ${match.id} (créé le ${match.createdAt})`)
        })
        
        console.log(`   ✅ À garder: ${toKeep.id} (créé le ${toKeep.createdAt})`)
      }
    })

    // 4. Supprimer les doublons
    if (toDelete.length > 0) {
      console.log(`🗑️ Suppression de ${toDelete.length} doublons...`)
      
      // Supprimer d'abord les ratings liés
      const ratingsDeleted = await prisma.rating.deleteMany({
        where: { matchId: { in: toDelete } }
      })
      
      const playerRatingsDeleted = await prisma.playerRating.deleteMany({
        where: { matchId: { in: toDelete } }
      })
      
      // Puis supprimer les matchs
      const matchesDeleted = await prisma.match.deleteMany({
        where: { id: { in: toDelete } }
      })
      
      duplicatesDeleted = matchesDeleted.count
      
      console.log(`✅ ${duplicatesDeleted} matchs supprimés`)
      console.log(`✅ ${ratingsDeleted.count} ratings de matchs supprimés`)
      console.log(`✅ ${playerRatingsDeleted.count} ratings de pilotes supprimés`)
    }

    // 5. Vérification finale
    const finalCount = await prisma.match.count({
      where: { sport: 'F1' }
    })

    res.status(200).json({
      success: true,
      message: '🧹 Nettoyage F1 terminé',
      stats: {
        initialCount: f1Matches.length,
        duplicatesFound,
        duplicatesDeleted,
        finalCount,
        uniqueRaces: matchGroups.size,
        ratingsDeleted: duplicatesDeleted > 0 ? true : false
      },
      recommendations: [
        'Actualisez votre page d\'accueil',
        'Filtrez par "F1" pour voir les GP uniques',
        'Les doublons ont été supprimés avec leurs notes'
      ]
    })

  } catch (error) {
    console.error('❌ Erreur nettoyage F1:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage des doublons F1',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}