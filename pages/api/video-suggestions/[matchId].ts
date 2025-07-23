// pages/api/video-suggestions/[matchId].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { matchId } = req.query

  if (req.method === 'GET') {
    // Récupérer toutes les suggestions pour un match
    return handleGetSuggestions(req, res, matchId as string)
  } 
  
  if (req.method === 'POST') {
    // Créer une nouvelle suggestion
    return handleCreateSuggestion(req, res, matchId as string)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// GET - Récupérer les suggestions
async function handleGetSuggestions(req: NextApiRequest, res: NextApiResponse, matchId: string) {
  try {
    const session = await getServerSession(req, res, authOptions)
    const currentUserId = session?.user?.id

    // Récupérer les suggestions avec votes et infos utilisateur
    const suggestions = await prisma.videoSuggestion.findMany({
      where: {
        matchId,
        isBlocked: false // Ne pas afficher les suggestions bloquées
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        },
        votes: {
          select: { userId: true, voteType: true }
        },
        reports: {
          where: { isResolved: false },
          select: { id: true }
        },
        _count: {
          select: {
            votes: true,
            reports: true
          }
        }
      },
      orderBy: [
        { isVerified: 'desc' }, // Vérifiées en premier
        { createdAt: 'desc' }   // Plus récentes ensuite
      ]
    })

    // Formater les données avec calcul des votes
    const formattedSuggestions = suggestions.map(suggestion => {
      const upvotes = suggestion.votes.filter(v => v.voteType === 'up').length
      const downvotes = suggestion.votes.filter(v => v.voteType === 'down').length
      const userVote = currentUserId ? 
        suggestion.votes.find(v => v.userId === currentUserId)?.voteType || null : null

      return {
        id: suggestion.id,
        matchId: suggestion.matchId,
        url: suggestion.url,
        title: suggestion.title,
        description: suggestion.description,
        platform: suggestion.platform,
        suggestedBy: {
          id: suggestion.user.id,
          name: suggestion.user.name || suggestion.user.username || 'Utilisateur',
          username: suggestion.user.username || 'user',
          image: suggestion.user.image
        },
        votes: {
          upvotes,
          downvotes,
          userVote: userVote as 'up' | 'down' | null
        },
        createdAt: suggestion.createdAt.toISOString(),
        isVerified: suggestion.isVerified,
        reportsCount: suggestion.reports.length
      }
    })

    // Trier par score (upvotes - downvotes)
    const sortedSuggestions = formattedSuggestions.sort((a, b) => {
      const scoreA = a.votes.upvotes - a.votes.downvotes
      const scoreB = b.votes.upvotes - b.votes.downvotes
      
      // Vérifiées en premier, puis par score, puis par date
      if (a.isVerified && !b.isVerified) return -1
      if (!a.isVerified && b.isVerified) return 1
      if (scoreA !== scoreB) return scoreB - scoreA
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    res.status(200).json({
      success: true,
      suggestions: sortedSuggestions
    })

  } catch (error) {
    console.error('❌ Erreur GET suggestions:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    })
  }
}

// POST - Créer une nouvelle suggestion
async function handleCreateSuggestion(req: NextApiRequest, res: NextApiResponse, matchId: string) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Connexion requise' })
  }

  try {
    const { url, title, description } = req.body

    // Validation basique
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL requise' })
    }

    if (!isValidVideoUrl(url)) {
      return res.status(400).json({ error: 'URL non supportée' })
    }

    // Vérifier si le match existe
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return res.status(404).json({ error: 'Match non trouvé' })
    }

    // Détecter la plateforme
    const platform = detectPlatform(url)

    // Vérifier les doublons
    const existing = await prisma.videoSuggestion.findFirst({
      where: {
        matchId,
        url: url.trim()
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'Cette vidéo a déjà été suggérée' })
    }

    // Limite de suggestions par utilisateur par match (anti-spam)
    const userSuggestions = await prisma.videoSuggestion.count({
      where: {
        matchId,
        userId: session.user.id
      }
    })

    if (userSuggestions >= 3) {
      return res.status(400).json({ error: 'Limite de 3 suggestions par match atteinte' })
    }

    // Créer la suggestion
    const suggestion = await prisma.videoSuggestion.create({
      data: {
        matchId,
        userId: session.user.id,
        url: url.trim(),
        title: title?.trim() || extractTitleFromUrl(url),
        description: description?.trim() || null,
        platform
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        }
      }
    })

    console.log(`✅ Nouvelle suggestion créée: ${suggestion.title} par ${suggestion.user.name}`)

    res.status(201).json({
      success: true,
      suggestion: {
        id: suggestion.id,
        matchId: suggestion.matchId,
        url: suggestion.url,
        title: suggestion.title,
        description: suggestion.description,
        platform: suggestion.platform,
        suggestedBy: {
          id: suggestion.user.id,
          name: suggestion.user.name || suggestion.user.username || 'Utilisateur',
          username: suggestion.user.username || 'user'
        },
        votes: {
          upvotes: 0,
          downvotes: 0,
          userVote: null
        },
        createdAt: suggestion.createdAt.toISOString(),
        isVerified: false
      }
    })

  } catch (error) {
    console.error('❌ Erreur création suggestion:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create suggestion'
    })
  }
}

// Fonctions utilitaires
function isValidVideoUrl(url: string): boolean {
  const validDomains = [
    'youtube.com', 'youtu.be', 'm.youtube.com',
    'dailymotion.com', 'dai.ly',
    'twitch.tv', 'clips.twitch.tv',
    'vimeo.com',
    'streamable.com'
  ]
  
  try {
    const urlObj = new URL(url)
    return validDomains.some(domain => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion'
  if (url.includes('twitch.tv')) return 'twitch'
  if (url.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('youtube')) {
      const videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop()
      return `Vidéo YouTube ${videoId}`
    }
    return `Vidéo ${urlObj.hostname}`
  } catch {
    return 'Nouvelle vidéo'
  }
}