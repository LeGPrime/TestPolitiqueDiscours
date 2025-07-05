// pages/api/teams/search.ts - API pour chercher toutes les équipes
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'

// Base de données d'équipes avec vrais logos
const TEAMS_DATABASE = {
  football: {
    'Premier League': [
      { name: 'Manchester City', logo: 'https://logos.football-data.org/65.png', country: 'England', founded: 1880 },
      { name: 'Arsenal FC', logo: 'https://logos.football-data.org/57.png', country: 'England', founded: 1886 },
      { name: 'Liverpool FC', logo: 'https://logos.football-data.org/64.png', country: 'England', founded: 1892 },
      { name: 'Chelsea FC', logo: 'https://logos.football-data.org/61.png', country: 'England', founded: 1905 },
      { name: 'Manchester United', logo: 'https://logos.football-data.org/66.png', country: 'England', founded: 1878 },
      { name: 'Tottenham Hotspur', logo: 'https://logos.football-data.org/73.png', country: 'England', founded: 1882 },
      { name: 'Newcastle United', logo: 'https://logos.football-data.org/67.png', country: 'England', founded: 1892 },
      { name: 'Brighton & Hove Albion', logo: 'https://logos.football-data.org/397.png', country: 'England', founded: 1901 }
    ],
    'Ligue 1': [
      { name: 'Paris Saint-Germain', logo: 'https://logos.football-data.org/524.png', country: 'France', founded: 1970 },
      { name: 'Olympique de Marseille', logo: 'https://logos.football-data.org/516.png', country: 'France', founded: 1899 },
      { name: 'Olympique Lyonnais', logo: 'https://logos.football-data.org/523.png', country: 'France', founded: 1950 },
      { name: 'AS Monaco', logo: 'https://logos.football-data.org/548.png', country: 'Monaco', founded: 1924 },
      { name: 'LOSC Lille', logo: 'https://logos.football-data.org/521.png', country: 'France', founded: 1944 },
      { name: 'OGC Nice', logo: 'https://logos.football-data.org/522.png', country: 'France', founded: 1904 }
    ],
    'La Liga': [
      { name: 'Real Madrid', logo: 'https://logos.football-data.org/86.png', country: 'Spain', founded: 1902 },
      { name: 'FC Barcelona', logo: 'https://logos.football-data.org/81.png', country: 'Spain', founded: 1899 },
      { name: 'Atlético Madrid', logo: 'https://logos.football-data.org/78.png', country: 'Spain', founded: 1903 },
      { name: 'Sevilla FC', logo: 'https://logos.football-data.org/559.png', country: 'Spain', founded: 1890 },
      { name: 'Valencia CF', logo: 'https://logos.football-data.org/95.png', country: 'Spain', founded: 1919 }
    ],
    'Serie A': [
      { name: 'Juventus', logo: 'https://logos.football-data.org/109.png', country: 'Italy', founded: 1897 },
      { name: 'AC Milan', logo: 'https://logos.football-data.org/98.png', country: 'Italy', founded: 1899 },
      { name: 'Inter Milan', logo: 'https://logos.football-data.org/108.png', country: 'Italy', founded: 1908 },
      { name: 'AS Roma', logo: 'https://logos.football-data.org/100.png', country: 'Italy', founded: 1927 },
      { name: 'SSC Napoli', logo: 'https://logos.football-data.org/113.png', country: 'Italy', founded: 1926 }
    ],
    'Bundesliga': [
      { name: 'Bayern Munich', logo: 'https://logos.football-data.org/5.png', country: 'Germany', founded: 1900 },
      { name: 'Borussia Dortmund', logo: 'https://logos.football-data.org/4.png', country: 'Germany', founded: 1909 },
      { name: 'RB Leipzig', logo: 'https://logos.football-data.org/721.png', country: 'Germany', founded: 2009 },
      { name: 'Bayer Leverkusen', logo: 'https://logos.football-data.org/3.png', country: 'Germany', founded: 1904 }
    ]
  },
  basketball: {
    'NBA': [
      { name: 'Los Angeles Lakers', logo: '🏀', country: 'USA', founded: 1947 },
      { name: 'Golden State Warriors', logo: '🏀', country: 'USA', founded: 1946 },
      { name: 'Boston Celtics', logo: '🏀', country: 'USA', founded: 1946 },
      { name: 'Chicago Bulls', logo: '🏀', country: 'USA', founded: 1966 },
      { name: 'Miami Heat', logo: '🏀', country: 'USA', founded: 1988 },
      { name: 'Brooklyn Nets', logo: '🏀', country: 'USA', founded: 1967 }
    ],
    'EuroLeague': [
      { name: 'Real Madrid Baloncesto', logo: '🏀', country: 'Spain', founded: 1931 },
      { name: 'FC Barcelona Basket', logo: '🏀', country: 'Spain', founded: 1926 },
      { name: 'Panathinaikos', logo: '🏀', country: 'Greece', founded: 1908 },
      { name: 'Olympiacos', logo: '🏀', country: 'Greece', founded: 1925 }
    ]
  },
  tennis: {
    'ATP': [
      { name: 'Novak Djokovic', logo: '🎾', country: 'Serbia', type: 'player' },
      { name: 'Rafael Nadal', logo: '🎾', country: 'Spain', type: 'player' },
      { name: 'Roger Federer', logo: '🎾', country: 'Switzerland', type: 'player' },
      { name: 'Carlos Alcaraz', logo: '🎾', country: 'Spain', type: 'player' },
      { name: 'Daniil Medvedev', logo: '🎾', country: 'Russia', type: 'player' }
    ],
    'WTA': [
      { name: 'Iga Swiatek', logo: '🎾', country: 'Poland', type: 'player' },
      { name: 'Aryna Sabalenka', logo: '🎾', country: 'Belarus', type: 'player' },
      { name: 'Coco Gauff', logo: '🎾', country: 'USA', type: 'player' },
      { name: 'Jessica Pegula', logo: '🎾', country: 'USA', type: 'player' }
    ]
  },
  f1: {
    'Formula 1': [
      { name: 'Max Verstappen', logo: '🏎️', country: 'Netherlands', type: 'player' },
      { name: 'Lewis Hamilton', logo: '🏎️', country: 'UK', type: 'player' },
      { name: 'Charles Leclerc', logo: '🏎️', country: 'Monaco', type: 'player' },
      { name: 'Lando Norris', logo: '🏎️', country: 'UK', type: 'player' },
      { name: 'George Russell', logo: '🏎️', country: 'UK', type: 'player' },
      { name: 'Carlos Sainz', logo: '🏎️', country: 'Spain', type: 'player' }
    ]
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { sport, search, league } = req.query
      
      let results: any[] = []
      
      // Filtrer par sport
      const sportData = sport && sport !== 'all' ? 
        { [sport as string]: TEAMS_DATABASE[sport as keyof typeof TEAMS_DATABASE] } : 
        TEAMS_DATABASE
      
      // Construire la liste des équipes
      Object.entries(sportData).forEach(([sportName, leagues]) => {
        if (leagues) {
          Object.entries(leagues).forEach(([leagueName, teams]) => {
            teams.forEach((team: any) => {
              if (!search || team.name.toLowerCase().includes((search as string).toLowerCase())) {
                if (!league || leagueName === league) {
                  results.push({
                    id: `${sportName}-${leagueName}-${team.name}`.replace(/\s+/g, '_').toLowerCase(),
                    name: team.name,
                    logo: team.logo,
                    sport: sportName,
                    league: leagueName,
                    country: team.country,
                    founded: team.founded,
                    type: team.type || 'team'
                  })
                }
              }
            })
          })
        }
      })
      
      // Trier par popularité simulée et nom
      results.sort((a, b) => {
        // Prioriser football > basketball > tennis > f1
        const sportOrder = { football: 0, basketball: 1, tennis: 2, f1: 3 }
        const sportDiff = (sportOrder[a.sport as keyof typeof sportOrder] || 4) - (sportOrder[b.sport as keyof typeof sportOrder] || 4)
        if (sportDiff !== 0) return sportDiff
        
        return a.name.localeCompare(b.name)
      })
      
      res.status(200).json({ teams: results.slice(0, 100) })
    } catch (error) {
      console.error('Erreur API teams/search:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}