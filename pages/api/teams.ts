// pages/api/teams.ts - Version complète qui gère tout
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'

// Stockage temporaire en mémoire pour les follows
let followedTeams: { [userId: string]: string[] } = {}

// Base de données d'équipes mockées pour la recherche
const mockTeamsDatabase = [
  // Basketball - NBA
  { id: 'lakers', name: 'Los Angeles Lakers', logo: '🟣🟡', sport: 'basketball', league: 'NBA', country: 'USA' },
  { id: 'warriors', name: 'Golden State Warriors', logo: '🔵🟡', sport: 'basketball', league: 'NBA', country: 'USA' },
  { id: 'nets', name: 'Brooklyn Nets', logo: '⚫⚪', sport: 'basketball', league: 'NBA', country: 'USA' },
  { id: 'bulls', name: 'Chicago Bulls', logo: '🔴⚫', sport: 'basketball', league: 'NBA', country: 'USA' },
  { id: 'celtics', name: 'Boston Celtics', logo: '🟢⚪', sport: 'basketball', league: 'NBA', country: 'USA' },
  { id: 'heat', name: 'Miami Heat', logo: '🔴⚫', sport: 'basketball', league: 'NBA', country: 'USA' },
  
  // Football - Ligue 1
  { id: 'psg', name: 'Paris Saint-Germain', logo: '🔵🔴', sport: 'football', league: 'Ligue 1', country: 'France' },
  { id: 'marseille', name: 'Olympique de Marseille', logo: '⚪🔵', sport: 'football', league: 'Ligue 1', country: 'France' },
  { id: 'monaco', name: 'AS Monaco', logo: '🔴⚪', sport: 'football', league: 'Ligue 1', country: 'France' },
  { id: 'lyon', name: 'Olympique Lyonnais', logo: '🔵⚪', sport: 'football', league: 'Ligue 1', country: 'France' },
  
  // Football - Premier League
  { id: 'mancity', name: 'Manchester City', logo: '🔵⚪', sport: 'football', league: 'Premier League', country: 'England' },
  { id: 'arsenal', name: 'Arsenal', logo: '🔴⚪', sport: 'football', league: 'Premier League', country: 'England' },
  { id: 'liverpool', name: 'Liverpool', logo: '🔴', sport: 'football', league: 'Premier League', country: 'England' },
  { id: 'chelsea', name: 'Chelsea', logo: '🔵', sport: 'football', league: 'Premier League', country: 'England' },
  
  // Football - La Liga
  { id: 'realmadrid', name: 'Real Madrid', logo: '⚪', sport: 'football', league: 'La Liga', country: 'Spain' },
  { id: 'barcelona', name: 'FC Barcelona', logo: '🔵🔴', sport: 'football', league: 'La Liga', country: 'Spain' },
  { id: 'atletico', name: 'Atlético Madrid', logo: '🔴⚪', sport: 'football', league: 'La Liga', country: 'Spain' },
  
  // Tennis
  { id: 'davis-cup-france', name: 'Équipe de France Davis Cup', logo: '🎾🇫🇷', sport: 'tennis', league: 'Davis Cup', country: 'France' },
  
  // F1
  { id: 'redbull-racing', name: 'Red Bull Racing', logo: '🔵🟡', sport: 'f1', league: 'Formula 1', country: 'Austria' },
  { id: 'ferrari', name: 'Scuderia Ferrari', logo: '🔴', sport: 'f1', league: 'Formula 1', country: 'Italy' },
  { id: 'mercedes', name: 'Mercedes-AMG F1', logo: '⚫🔵', sport: 'f1', league: 'Formula 1', country: 'Germany' },
  
  // Rugby
  { id: 'stade-francais', name: 'Stade Français', logo: '🌸', sport: 'rugby', league: 'Top 14', country: 'France' },
  { id: 'toulouse', name: 'Stade Toulousain', logo: '🔴⚫', sport: 'rugby', league: 'Top 14', country: 'France' }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🐛 API teams appelée!', req.method, req.query, req.body)
  
  if (req.method === 'GET') {
    const { followed, sport, search, league } = req.query
    
    // Si on veut les équipes suivies
    if (followed === 'true') {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Non connecté' })
      }
      
      const userId = session.user.id
      const userFollows = followedTeams[userId] || []
      
      const followedTeamsList = userFollows.map(teamId => {
        const team = mockTeamsDatabase.find(t => t.id === teamId)
        return team ? {
          ...team,
          type: 'team',
          isFollowed: true,
          followersCount: Math.floor(Math.random() * 10000),
          followedSince: new Date().toISOString()
        } : null
      }).filter(Boolean)
      
      console.log('🐛 Retour équipes suivies:', followedTeamsList.length)
      return res.status(200).json({ teams: followedTeamsList })
    }
    
    // Sinon, recherche d'équipes
    let filteredTeams = [...mockTeamsDatabase]
    
    // Filtrer par sport
    if (sport && sport !== 'all') {
      filteredTeams = filteredTeams.filter(team => team.sport === sport)
    }
    
    // Filtrer par recherche
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      filteredTeams = filteredTeams.filter(team => 
        team.name.toLowerCase().includes(searchLower) ||
        team.league.toLowerCase().includes(searchLower) ||
        team.country.toLowerCase().includes(searchLower)
      )
    }
    
    // Filtrer par ligue
    if (league && league !== 'all') {
      filteredTeams = filteredTeams.filter(team => team.league === league)
    }
    
    // Ajouter les infos de follow si connecté
    const session = await getServerSession(req, res, authOptions)
    const userId = session?.user?.id
    const userFollows = userId ? (followedTeams[userId] || []) : []
    
    const teamsWithFollowStatus = filteredTeams.map(team => ({
      ...team,
      type: 'team',
      isFollowed: userFollows.includes(team.id),
      followersCount: Math.floor(Math.random() * 10000),
      founded: 1900 + Math.floor(Math.random() * 120)
    }))
    
    console.log('🐛 Recherche équipes:', {
      total: teamsWithFollowStatus.length,
      filters: { sport, search, league }
    })
    
    return res.status(200).json({ teams: teamsWithFollowStatus })
    
  } else if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Non connecté' })
    }
    
    const userId = session.user.id
    const { action, teamId } = req.body
    
    console.log('🐛 POST teams - Action:', action, 'Team:', teamId)

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID manquant' })
    }

    // Initialiser le tableau si pas encore fait
    if (!followedTeams[userId]) {
      followedTeams[userId] = []
    }

    if (action === 'follow') {
      if (!followedTeams[userId].includes(teamId)) {
        followedTeams[userId].push(teamId)
      }
      console.log('🐛 Follow réussi, équipes suivies:', followedTeams[userId])
      res.status(200).json({ success: true, message: 'Équipe suivie' })
      
    } else if (action === 'unfollow') {
      followedTeams[userId] = followedTeams[userId].filter(id => id !== teamId)
      console.log('🐛 Unfollow réussi, équipes suivies:', followedTeams[userId])
      res.status(200).json({ success: true, message: 'Équipe non suivie' })
      
    } else {
      res.status(400).json({ error: 'Action non supportée' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}