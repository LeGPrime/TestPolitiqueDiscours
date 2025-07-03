// pages/api/delete-all-f1.ts - VERSION COMPLÈTE CORRIGÉE
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
    console.log('🚨 SUPPRESSION COMPLÈTE F1 DEMANDÉE...')
    
    // Compter avant suppression
    const f1Matches = await prisma.match.findMany({ 
      where: { sport: 'F1' }, 
      select: { id: true } 
    })
    const f1MatchIds = f1Matches.map(m => m.id)
    
    const initialStats = await Promise.all([
      prisma.match.count({ where: { sport: 'F1' } }),
      prisma.player.count({ where: { sport: 'F1' } }),
      prisma.playerRating.count({ where: { matchId: { in: f1MatchIds } } }),
      prisma.rating.count({ where: { matchId: { in: f1MatchIds } } })
    ])

    const [initialMatches, initialDrivers, initialPlayerRatings, initialMatchRatings] = initialStats
    
    console.log(`📊 Avant suppression :`)
    console.log(`  • ${initialMatches} matchs F1`)
    console.log(`  • ${initialDrivers} pilotes F1`) 
    console.log(`  • ${initialPlayerRatings} notes de pilotes`)
    console.log(`  • ${initialMatchRatings} notes de matchs`)

    // 1. Supprimer toutes les notes de pilotes F1
    console.log('🗑️ Suppression des notes de pilotes F1...')
    const deletedPlayerRatings = await prisma.playerRating.deleteMany({
      where: { matchId: { in: f1MatchIds } }
    })

    // 2. Supprimer toutes les notes de matchs F1
    console.log('🗑️ Suppression des notes de matchs F1...')
    const deletedMatchRatings = await prisma.rating.deleteMany({
      where: { matchId: { in: f1MatchIds } }
    })

    // 3. Supprimer tous les matchs F1
    console.log('🗑️ Suppression des matchs F1...')
    const deletedMatches = await prisma.match.deleteMany({
      where: { sport: 'F1' }
    })

    // 4. Supprimer tous les pilotes F1
    console.log('🗑️ Suppression des pilotes F1...')
    const deletedDrivers = await prisma.player.deleteMany({
      where: { 
        OR: [
          { sport: 'F1' },
          { id: { startsWith: 'f1_driver_' } }
        ]
      }
    })

    // Vérification finale
    const finalStats = await Promise.all([
      prisma.match.count({ where: { sport: 'F1' } }),
      prisma.player.count({ where: { sport: 'F1' } }),
      prisma.playerRating.count({
        where: {
          player: {
            OR: [
              { sport: 'F1' },
              { id: { startsWith: 'f1_driver_' } }
            ]
          }
        }
      })
    ])

    const [finalMatches, finalDrivers, finalPlayerRatings] = finalStats

    console.log(`✅ Après suppression :`)
    console.log(`  • ${finalMatches} matchs F1 (devrait être 0)`)
    console.log(`  • ${finalDrivers} pilotes F1 (devrait être 0)`)
    console.log(`  • ${finalPlayerRatings} notes de pilotes F1 (devrait être 0)`)

    res.status(200).json({
      success: true,
      message: '🚨 SUPPRESSION COMPLÈTE F1 TERMINÉE',
      stats: {
        matchesDeleted: deletedMatches.count,
        driversDeleted: deletedDrivers.count,
        playerRatingsDeleted: deletedPlayerRatings.count,
        matchRatingsDeleted: deletedMatchRatings.count,
        verification: {
          remainingMatches: finalMatches,
          remainingDrivers: finalDrivers, 
          remainingPlayerRatings: finalPlayerRatings
        }
      },
      recommendations: [
        'La base F1 est maintenant complètement vide',
        'Vous pouvez faire un import propre',
        'Testez d\'abord la connexion API avant d\'importer',
        'Considérez le nouveau système week-end intelligent'
      ]
    })

  } catch (error) {
    console.error('❌ Erreur suppression complète F1:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression complète F1',
      message: error instanceof Error ? error.message : 'Unknown error',
      tip: 'Vérifiez les contraintes de clés étrangères dans votre base'
    })
  }
}