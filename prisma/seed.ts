import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Ajout de matchs populaires...')

  // Supprimer les anciens matchs d'exemple
  await prisma.match.deleteMany({
    where: {
      apiMatchId: {
        in: [1001, 1002, 1003, 1004, 1005]
      }
    }
  })

  // Créer des matchs européens populaires récents
  const matches = await Promise.all([
    // Premier League
    prisma.match.upsert({
      where: { apiMatchId: 2001 },
      update: {},
      create: {
        apiMatchId: 2001,
        homeTeam: 'Manchester City',
        awayTeam: 'Arsenal FC',
        homeScore: 4,
        awayScore: 1,
        date: new Date('2024-06-12T17:30:00Z'),
        status: 'FINISHED',
        competition: 'Premier League',
        season: '2024-2025',
        venue: 'Etihad Stadium',
        homeTeamLogo: 'https://crests.football-data.org/65.png',
        awayTeamLogo: 'https://crests.football-data.org/57.png',
      }
    }),
    
    // Ligue 1
    prisma.match.upsert({
      where: { apiMatchId: 2002 },
      update: {},
      create: {
        apiMatchId: 2002,
        homeTeam: 'Paris Saint-Germain',
        awayTeam: 'Olympique de Marseille',
        homeScore: 3,
        awayScore: 0,
        date: new Date('2024-06-11T21:00:00Z'),
        status: 'FINISHED',
        competition: 'Ligue 1',
        season: '2024-2025',
        venue: 'Parc des Princes',
        homeTeamLogo: 'https://crests.football-data.org/524.png',
        awayTeamLogo: 'https://crests.football-data.org/516.png',
      }
    }),

    // La Liga
    prisma.match.upsert({
      where: { apiMatchId: 2003 },
      update: {},
      create: {
        apiMatchId: 2003,
        homeTeam: 'Real Madrid',
        awayTeam: 'FC Barcelona',
        homeScore: 2,
        awayScore: 1,
        date: new Date('2024-06-10T20:00:00Z'),
        status: 'FINISHED',
        competition: 'La Liga',
        season: '2024-2025',
        venue: 'Santiago Bernabéu',
        homeTeamLogo: 'https://crests.football-data.org/86.png',
        awayTeamLogo: 'https://crests.football-data.org/81.png',
      }
    }),

    // Serie A
    prisma.match.upsert({
      where: { apiMatchId: 2004 },
      update: {},
      create: {
        apiMatchId: 2004,
        homeTeam: 'Juventus',
        awayTeam: 'AC Milan',
        homeScore: 1,
        awayScore: 2,
        date: new Date('2024-06-09T18:45:00Z'),
        status: 'FINISHED',
        competition: 'Serie A',
        season: '2024-2025',
        venue: 'Allianz Stadium',
        homeTeamLogo: 'https://crests.football-data.org/109.png',
        awayTeamLogo: 'https://crests.football-data.org/98.png',
      }
    }),

    // Bundesliga
    prisma.match.upsert({
      where: { apiMatchId: 2005 },
      update: {},
      create: {
        apiMatchId: 2005,
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        homeScore: 3,
        awayScore: 2,
        date: new Date('2024-06-08T18:30:00Z'),
        status: 'FINISHED',
        competition: 'Bundesliga',
        season: '2024-2025',
        venue: 'Allianz Arena',
        homeTeamLogo: 'https://crests.football-data.org/5.png',
        awayTeamLogo: 'https://crests.football-data.org/4.png',
      }
    }),

    // Premier League
    prisma.match.upsert({
      where: { apiMatchId: 2006 },
      update: {},
      create: {
        apiMatchId: 2006,
        homeTeam: 'Liverpool',
        awayTeam: 'Chelsea',
        homeScore: 4,
        awayScore: 3,
        date: new Date('2024-06-07T17:30:00Z'),
        status: 'FINISHED',
        competition: 'Premier League',
        season: '2024-2025',
        venue: 'Anfield',
        homeTeamLogo: 'https://crests.football-data.org/64.png',
        awayTeamLogo: 'https://crests.football-data.org/61.png',
      }
    }),

    // Champions League
    prisma.match.upsert({
      where: { apiMatchId: 2007 },
      update: {},
      create: {
        apiMatchId: 2007,
        homeTeam: 'Manchester City',
        awayTeam: 'Real Madrid',
        homeScore: 1,
        awayScore: 3,
        date: new Date('2024-06-06T21:00:00Z'),
        status: 'FINISHED',
        competition: 'UEFA Champions League',
        season: '2024-2025',
        venue: 'Etihad Stadium',
        homeTeamLogo: 'https://crests.football-data.org/65.png',
        awayTeamLogo: 'https://crests.football-data.org/86.png',
      }
    }),

    // Ligue 1
    prisma.match.upsert({
      where: { apiMatchId: 2008 },
      update: {},
      create: {
        apiMatchId: 2008,
        homeTeam: 'AS Monaco',
        awayTeam: 'Olympique Lyonnais',
        homeScore: 2,
        awayScore: 0,
        date: new Date('2024-06-05T19:00:00Z'),
        status: 'FINISHED',
        competition: 'Ligue 1',
        season: '2024-2025',
        venue: 'Stade Louis II',
        homeTeamLogo: 'https://crests.football-data.org/548.png',
        awayTeamLogo: 'https://crests.football-data.org/523.png',
      }
    })
  ])

  console.log(`✅ ${matches.length} matchs populaires créés`)

  // Ajouter quelques notes d'exemple pour rendre c'est plus intéressant
  const users = await prisma.user.findMany({ take: 3 })
  
  if (users.length > 0) {
    console.log('🎯 Ajout de notes d\'exemple...')
    
    const sampleRatings = [
      { matchIndex: 0, rating: 5, comment: "El Clasico au top niveau ! Real Madrid impressionnant 🔥" },
      { matchIndex: 1, rating: 4, comment: "PSG dominateur, Mbappé en feu ⚽" },
      { matchIndex: 2, rating: 5, comment: "Derby de la Mersey spectaculaire ! 7 buts, que demander de plus ?" },
      { matchIndex: 3, rating: 3, comment: "Match correct sans plus, manque d'intensité" },
      { matchIndex: 4, rating: 4, comment: "Der Klassiker toujours au niveau, beau spectacle" },
    ]

    for (let i = 0; i < sampleRatings.length && i < users.length; i++) {
      const sample = sampleRatings[i]
      const user = users[i % users.length]
      const match = matches[sample.matchIndex]

      try {
        await prisma.rating.create({
          data: {
            userId: user.id,
            matchId: match.id,
            rating: sample.rating,
            comment: sample.comment,
          }
        })

        // Mettre à jour les stats du match
        const allRatings = await prisma.rating.findMany({
          where: { matchId: match.id }
        })
        
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        
        await prisma.match.update({
          where: { id: match.id },
          data: {
            avgRating,
            totalRatings: allRatings.length,
          }
        })
      } catch (error) {
        console.log(`⚠️ Note ${i} déjà existante, skip...`)
      }
    }
  }

  console.log('🎉 Seed terminé avec succès !')
  console.log(`
📊 Résumé :
- ${matches.length} matchs européens populaires ajoutés
- Compétitions : Premier League, Ligue 1, La Liga, Serie A, Bundesliga, Champions League
- Matchs récents avec logos d'équipes
- Notes d'exemple pour montrer l'activité

🚀 Actualise ton app pour voir les nouveaux matchs !
  `)
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
