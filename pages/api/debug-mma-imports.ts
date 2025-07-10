// pages/api/debug-mma-imports.ts
// 🔍 VÉRIFIER CE QUI A ÉTÉ IMPORTÉ EN BASE

import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const prisma = new PrismaClient()

    // Vérifier tous les sports dans la base
    const sportStats = await prisma.match.groupBy({
      by: ['sport'],
      _count: {
        sport: true
      }
    })

    // Récupérer quelques combats MMA récents
    const mmaMatches = await prisma.match.findMany({
      where: {
        sport: 'MMA'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        sport: true,
        competition: true,
        season: true,
        date: true,
        status: true,
        homeScore: true,
        awayScore: true,
        createdAt: true,
        details: true
      }
    })

    // Vérifier le total de combats par sport
    const totalMatches = await prisma.match.count()
    const mmaCount = await prisma.match.count({
      where: { sport: 'MMA' }
    })

    await prisma.$disconnect()

    return res.status(200).json({
      success: true,
      message: 'Debug des imports MMA',
      data: {
        totalMatches,
        mmaCount,
        sportStats,
        recentMMAMatches: mmaMatches,
        analysis: {
          mmaImported: mmaCount > 0,
          sportValues: sportStats.map(s => s.sport),
          possibleIssues: mmaCount === 0 ? [
            'Aucun combat MMA trouvé',
            'Vérifier le champ sport dans la base',
            'Import peut avoir échoué silencieusement'
          ] : mmaCount > 0 && mmaMatches.length === 0 ? [
            'Combats MMA présents mais pas récupérés',
            'Problème de requête Prisma',
            'Vérifier les filtres'
          ] : [
            'Combats MMA trouvés et récupérés',
            'Problème probablement dans l\'interface'
          ]
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur debug MMA:', error)
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      help: 'Vérifiez que Prisma est connecté et que la table matches existe'
    })
  }
}