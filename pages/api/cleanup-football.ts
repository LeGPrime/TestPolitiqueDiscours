// pages/api/cleanup-football.ts
// 🧹 NETTOYAGE COMPLET DE LA BASE FOOTBALL
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

  const { action, confirm } = req.body

  try {
    if (action === 'analyze') {
      // 🔍 ANALYSER CE QU'ON A ACTUELLEMENT
      console.log('🔍 Analyse de la base football actuelle...')
      
      const stats = await analyzeFootballData()
      
      return res.status(200).json({
        success: true,
        action: 'analyze',
        stats,
        message: '📊 Analyse terminée'
      })
    }

    if (action === 'cleanup' && confirm === 'DELETE_ALL_FOOTBALL') {
      // 🧹 NETTOYAGE COMPLET
      console.log('🧹 NETTOYAGE COMPLET DE LA BASE FOOTBALL...')
      
      const result = await cleanupFootballData()
      
      return res.status(200).json({
        success: true,
        action: 'cleanup',
        result,
        message: '🎉 Nettoyage terminé ! Base prête pour les nouveaux imports.'
      })
    }

    return res.status(400).json({
      error: 'Action non supportée',
      availableActions: ['analyze', 'cleanup'],
      note: 'Pour cleanup, ajouter confirm: "DELETE_ALL_FOOTBALL"'
    })

  } catch (error) {
    console.error('❌ Erreur nettoyage:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur lors du nettoyage',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

// 🔍 ANALYSER LES DONNÉES FOOTBALL ACTUELLES
async function analyzeFootballData() {
  console.log('📊 Analyse des données football...')

  // Compter les matchs football
  const totalFootball = await prisma.match.count({
    where: { sport: 'FOOTBALL' }
  })

  // Statistiques par compétition
  const byCompetition = await prisma.match.groupBy({
    by: ['competition'],
    where: { sport: 'FOOTBALL' },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  })

  // Statistiques par saison
  const bySeason = await prisma.match.groupBy({
    by: ['season'],
    where: { sport: 'FOOTBALL' },
    _count: { id: true },
    orderBy: { season: 'desc' }
  })

  // Statistiques par statut
  const byStatus = await prisma.match.groupBy({
    by: ['status'],
    where: { sport: 'FOOTBALL' },
    _count: { id: true }
  })

  // Plage de dates
  const dateRange = await prisma.match.aggregate({
    where: { sport: 'FOOTBALL' },
    _min: { date: true },
    _max: { date: true }
  })

  // Compter les ratings football
  const footballMatchIds = await prisma.match.findMany({
    where: { sport: 'FOOTBALL' },
    select: { id: true }
  })

  const totalRatings = await prisma.rating.count({
    where: { 
      matchId: { 
        in: footballMatchIds.map(m => m.id) 
      } 
    }
  })

  // Compter les player ratings football
  const totalPlayerRatings = await prisma.playerRating.count({
    where: { 
      matchId: { 
        in: footballMatchIds.map(m => m.id) 
      } 
    }
  })

  // Compter les événements football
  const totalEvents = await prisma.matchEvent.count({
    where: { 
      matchId: { 
        in: footballMatchIds.map(m => m.id) 
      } 
    }
  })

  console.log(`📊 Analyse terminée: ${totalFootball} matchs football trouvés`)

  return {
    totalMatches: totalFootball,
    totalRatings,
    totalPlayerRatings,
    totalEvents,
    competitions: byCompetition.map(c => ({
      name: c.competition,
      count: c._count.id
    })),
    seasons: bySeason.map(s => ({
      season: s.season,
      count: s._count.id
    })),
    statuses: byStatus.map(s => ({
      status: s.status,
      count: s._count.id
    })),
    dateRange: {
      oldest: dateRange._min.date,
      newest: dateRange._max.date
    },
    summary: {
      matchesRange: `${dateRange._min.date?.toLocaleDateString()} - ${dateRange._max.date?.toLocaleDateString()}`,
      topCompetitions: byCompetition.slice(0, 5).map(c => `${c.competition} (${c._count.id})`),
      hasRatings: totalRatings > 0,
      hasPlayerRatings: totalPlayerRatings > 0,
      hasEvents: totalEvents > 0
    }
  }
}

// 🧹 NETTOYAGE COMPLET DES DONNÉES FOOTBALL
async function cleanupFootballData() {
  console.log('🧹 Démarrage du nettoyage complet...')

  const result = {
    deleted: {
      events: 0,
      playerRatings: 0,
      ratings: 0,
      matches: 0
    },
    duration: 0
  }

  const startTime = Date.now()

  try {
    // 1️⃣ Récupérer tous les IDs des matchs football
    console.log('🔍 Récupération des matchs football...')
    const footballMatches = await prisma.match.findMany({
      where: { sport: 'FOOTBALL' },
      select: { id: true }
    })

    const footballMatchIds = footballMatches.map(m => m.id)
    console.log(`📊 ${footballMatchIds.length} matchs football trouvés`)

    if (footballMatchIds.length === 0) {
      console.log('✅ Aucun match football à supprimer')
      return result
    }

    // 2️⃣ Supprimer les événements de matchs (match_events)
    console.log('🗑️ Suppression des événements de matchs...')
    const deletedEvents = await prisma.matchEvent.deleteMany({
      where: { matchId: { in: footballMatchIds } }
    })
    result.deleted.events = deletedEvents.count
    console.log(`✅ ${deletedEvents.count} événements supprimés`)

    // 3️⃣ Supprimer les notations de joueurs (player_ratings)
    console.log('🗑️ Suppression des notations de joueurs...')
    const deletedPlayerRatings = await prisma.playerRating.deleteMany({
      where: { matchId: { in: footballMatchIds } }
    })
    result.deleted.playerRatings = deletedPlayerRatings.count
    console.log(`✅ ${deletedPlayerRatings.count} notations de joueurs supprimées`)

    // 4️⃣ Supprimer les notations de matchs (ratings)
    console.log('🗑️ Suppression des notations de matchs...')
    const deletedRatings = await prisma.rating.deleteMany({
      where: { matchId: { in: footballMatchIds } }
    })
    result.deleted.ratings = deletedRatings.count
    console.log(`✅ ${deletedRatings.count} notations de matchs supprimées`)

    // 5️⃣ Supprimer les matchs football eux-mêmes
    console.log('🗑️ Suppression des matchs football...')
    const deletedMatches = await prisma.match.deleteMany({
      where: { sport: 'FOOTBALL' }
    })
    result.deleted.matches = deletedMatches.count
    console.log(`✅ ${deletedMatches.count} matchs football supprimés`)

    // 6️⃣ Nettoyage optionnel des joueurs orphelins
    console.log('🧹 Nettoyage des joueurs orphelins...')
    const orphanPlayers = await prisma.player.deleteMany({
      where: {
        sport: 'FOOTBALL',
        ratings: { none: {} }
      }
    })
    console.log(`✅ ${orphanPlayers.count} joueurs orphelins supprimés`)

    result.duration = Math.round((Date.now() - startTime) / 1000)

    console.log(`🎉 Nettoyage terminé en ${result.duration}s !`)
    console.log(`📊 Résumé:`)
    console.log(`   - ${result.deleted.matches} matchs`)
    console.log(`   - ${result.deleted.ratings} notations`)
    console.log(`   - ${result.deleted.playerRatings} notations joueurs`)
    console.log(`   - ${result.deleted.events} événements`)
    console.log(`   - ${orphanPlayers.count} joueurs orphelins`)

    return result

  } catch (error) {
    console.error('❌ Erreur pendant le nettoyage:', error)
    throw error
  }
}