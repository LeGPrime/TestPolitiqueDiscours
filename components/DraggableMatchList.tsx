// components/DraggableMatchList.tsx - Version finale robuste
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Star, Calendar, MapPin, Eye, GripVertical } from 'lucide-react'
import Link from 'next/link'
import axios from 'axios'

interface ListItem {
  id: string
  note?: string
  position: number
  addedAt: string
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore?: number
    awayScore?: number
    date: string
    competition: string
    sport: string
    venue?: string
    homeTeamLogo?: string
    awayTeamLogo?: string
    avgRating: number
    totalRatings: number
  }
}

interface DraggableMatchListProps {
  items: ListItem[]
  listId: string
  isOwner: boolean
  onItemsReorder: (newItems: ListItem[]) => void
}

export default function DraggableMatchList({ 
  items, 
  listId, 
  isOwner, 
  onItemsReorder 
}: DraggableMatchListProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [enabled, setEnabled] = useState(false)

  // Fix d'hydratation crucial
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true))
    return () => {
      cancelAnimationFrame(animation)
      setEnabled(false)
    }
  }, [])

  const getSportEmoji = (sport: string) => {
    const emojis = {
      'FOOTBALL': '⚽',
      'BASKETBALL': '🏀', 
      'MMA': '🥊',
      'RUGBY': '🏉',
      'F1': '🏎️'
    }
    return emojis[sport as keyof typeof emojis] || '🏆'
  }

  const formatScore = (homeScore: any, awayScore: any, sport: string) => {
    if (sport === 'F1') return 'COURSE TERMINÉE'
    if (sport === 'MMA') return `${homeScore} vs ${awayScore}`
    return `${homeScore ?? '?'} - ${awayScore ?? '?'}`
  }

  const handleDragStart = () => {
    console.log('🎯 Drag started!')
    setIsDragging(true)
  }

  const handleDragEnd = async (result: DropResult) => {
    console.log('🎯 Drag ended:', result)
    setIsDragging(false)

    if (!result.destination || result.destination.index === result.source.index) {
      console.log('❌ Pas de changement de position')
      return
    }

    if (!isOwner) {
      console.log('❌ Seul le propriétaire peut réorganiser')
      return
    }

    console.log(`📦 Déplacement: ${result.source.index} → ${result.destination.index}`)

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    // Mise à jour immédiate de l'UI
    onItemsReorder(newItems)

    // Sauvegarde en backend
    try {
      setIsUpdating(true)
      
      const updates = newItems.map((item, index) => ({
        itemId: item.id,
        position: index + 1
      }))

      console.log('💾 Sauvegarde positions:', updates)

      const response = await axios.post('/api/match-list-items/reorder', {
        listId,
        updates
      })

      console.log('✅ Ordre sauvegardé!', response.data)
      showNotification('✅ Ordre sauvegardé !', 'success')
    } catch (error) {
      console.error('❌ Erreur sauvegarde ordre:', error)
      onItemsReorder(items)
      showNotification('❌ Erreur lors de la sauvegarde', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-white font-medium ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Star className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p>Cette liste est vide</p>
      </div>
    )
  }

  // Si pas encore activé côté client, affichage statique
  if (!enabled) {
    return (
      <div className="space-y-4" suppressHydrationWarning>
        {/* Instructions de chargement */}
        {isOwner && (
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 inline-block border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              Activation du système de réorganisation...
            </p>
          </div>
        )}
        
        {items.map((item, index) => (
          <StaticMatchCard 
            key={item.id} 
            item={item} 
            position={index + 1}
            getSportEmoji={getSportEmoji}
            formatScore={formatScore}
            isOwner={isOwner}
          />
        ))}
      </div>
    )
  }

  // Version avec drag & drop activée
  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* Indicateur de mise à jour */}
      {isUpdating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-800 dark:text-blue-200 text-sm">Sauvegarde de l'ordre...</span>
        </div>
      )}

      {/* Instructions */}
      {isOwner && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            <GripVertical className="w-4 h-4 inline mr-1" />
            ✨ Système de réorganisation activé ! Glissez-déposez les matchs.
          </p>
        </div>
      )}

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId="matches-droppable">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 transition-all duration-200 ${
                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2' : ''
              }`}
            >
              {items.map((item, index) => {
                // Créer un ID stable et unique
                const stableId = `match-${item.id}-${index}`
                
                return (
                  <Draggable 
                    key={stableId}
                    draggableId={stableId}
                    index={index}
                    isDragDisabled={!isOwner}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all duration-200 ${
                          snapshot.isDragging 
                            ? 'rotate-1 shadow-2xl scale-[1.02] z-50' 
                            : ''
                        } ${
                          isDragging && !snapshot.isDragging 
                            ? 'opacity-60' 
                            : ''
                        }`}
                      >
                        <DraggableMatchCard
                          item={item}
                          position={index + 1}
                          getSportEmoji={getSportEmoji}
                          formatScore={formatScore}
                          isDragging={snapshot.isDragging}
                          dragHandleProps={isOwner ? provided.dragHandleProps : undefined}
                          isOwner={isOwner}
                        />
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

// Composant statique pour l'état de chargement
function StaticMatchCard({ 
  item, 
  position, 
  getSportEmoji, 
  formatScore,
  isOwner 
}: {
  item: ListItem
  position: number
  getSportEmoji: (sport: string) => string
  formatScore: (homeScore: any, awayScore: any, sport: string) => string
  isOwner: boolean
}) {
  const { match } = item

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="flex items-center space-x-2 flex-shrink-0">
          {isOwner && (
            <div className="p-2 text-gray-300 rounded-lg">
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-xl flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">
            {position}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">{getSportEmoji(match.sport)}</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              {match.competition}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {match.sport === 'F1' 
              ? `🏁 ${match.homeTeam}` 
              : `${match.homeTeam} vs ${match.awayTeam}`
            }
          </h3>

          <Link
            href={`/match/${match.id}`}
            className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Voir le match</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Composant draggable optimisé
function DraggableMatchCard({ 
  item, 
  position, 
  getSportEmoji, 
  formatScore,
  isDragging,
  dragHandleProps,
  isOwner
}: {
  item: ListItem
  position: number
  getSportEmoji: (sport: string) => string
  formatScore: (homeScore: any, awayScore: any, sport: string) => string
  isDragging: boolean
  dragHandleProps?: any
  isOwner: boolean
}) {
  const { match } = item

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 transition-all duration-300 ${
      isDragging 
        ? 'border-blue-500 shadow-2xl bg-blue-50 dark:bg-blue-900/20' 
        : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl'
    }`}>
      <div className="flex items-start space-x-4 p-6">
        {/* Handle + Position */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Drag handle avec meilleur style */}
          {isOwner && (
            <div 
              {...dragHandleProps}
              className={`p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
                isDragging 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
              title="🖱️ Glisser pour réorganiser"
            >
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
            isDragging 
              ? 'bg-blue-500 text-white' 
              : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600 text-gray-600 dark:text-gray-400'
          }`}>
            {position}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg">{getSportEmoji(match.sport)}</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
              {match.competition}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(match.date).toLocaleDateString('fr-FR')}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {match.sport === 'F1' 
              ? `🏁 ${match.homeTeam}` 
              : `${match.homeTeam} vs ${match.awayTeam}`
            }
          </h3>

          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <span className="font-medium">
              Score: {formatScore(match.homeScore, match.awayScore, match.sport)}
            </span>
            {match.venue && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-32">{match.venue}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{match.avgRating > 0 ? match.avgRating.toFixed(1) : '—'}</span>
            </div>
            <span>{match.totalRatings} vote{match.totalRatings > 1 ? 's' : ''}</span>
          </div>

          {item.note && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded-r-lg mb-3">
              <p className="text-sm text-blue-800 dark:text-blue-300 italic">
                💭 "{item.note}"
              </p>
            </div>
          )}

          {/* Lien désactivé pendant le drag */}
          <div className={isDragging ? 'pointer-events-none' : ''}>
            <Link
              href={`/match/${match.id}`}
              className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>Voir le match</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}