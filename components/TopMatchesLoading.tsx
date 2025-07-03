// components/TopMatchesLoading.tsx
import React from 'react'

export function TopMatchesLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-lg w-64 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-96 animate-pulse"></div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg mx-1 animate-pulse"></div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-8">
        {/* Podium skeleton */}
        <section>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </section>

        {/* Hot this week skeleton */}
        <section>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Sports overview skeleton */}
        <section>
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-44 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SportCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
      </div>

      {/* Match info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
        </div>
        
        <div className="mx-3">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
        </div>
        
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1"></div>
          <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-6"></div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
    </div>
  )
}

export function SportCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-16"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8"></div>
        </div>
        
        <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
          <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full mb-2"></div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div 
          key={i} 
          className={`rounded-xl p-6 animate-pulse ${
            i === 0 ? 'bg-gradient-to-br from-yellow-200 to-yellow-400' :
            i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400' :
            'bg-gradient-to-br from-orange-200 to-orange-400'
          }`}
        >
          <div className="text-center mb-4">
            <div className="h-8 bg-white/30 rounded mb-2 w-12 mx-auto"></div>
            <div className="h-4 bg-white/30 rounded w-20 mx-auto"></div>
          </div>
          
          <div className="text-center mb-3">
            <div className="h-8 bg-white/30 rounded w-8 mx-auto mb-1"></div>
            <div className="h-4 bg-white/30 rounded w-16 mx-auto"></div>
          </div>

          <div className="text-center space-y-2">
            <div className="h-5 bg-white/30 rounded w-full"></div>
            <div className="h-6 bg-white/30 rounded w-16 mx-auto"></div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 bg-white/30 rounded"></div>
              <div className="h-6 bg-white/30 rounded w-8"></div>
              <div className="h-4 bg-white/30 rounded w-6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Composant d'erreur pour la page top matches
export function TopMatchesError({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry: () => void 
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center max-w-md w-full border border-gray-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">😔</span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Erreur de chargement
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Impossible de charger le top des événements
        </p>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400 font-mono">
            {error}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full btn-mobile-primary"
          >
            🔄 Réessayer
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full btn-mobile-secondary"
          >
            🏠 Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant d'état vide
export function TopMatchesEmpty({ 
  period,
  onChangePeriod 
}: { 
  period: string
  onChangePeriod: (period: string) => void 
}) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🏆</span>
      </div>
      
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
        Aucun événement trouvé
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {period === 'week' && "Aucun événement noté cette semaine. Les utilisateurs n'ont pas encore donné leurs avis !"}
        {period === 'month' && "Aucun événement noté ce mois-ci. Soyez le premier à noter un événement !"}
        {period === 'year' && "Aucun événement noté cette année. L'année commence tout juste !"}
        {period === 'all-time' && "Aucun événement n'a encore été noté. Découvrez les premiers événements à noter !"}
      </p>
      
      <div className="space-y-4">
        {period !== 'all-time' && (
          <button
            onClick={() => onChangePeriod('all-time')}
            className="btn-mobile-primary"
          >
            📊 Voir tous les événements
          </button>
        )}
        
        <button
          onClick={() => window.location.href = '/'}
          className="btn-mobile-secondary"
        >
          ⚽ Découvrir des événements
        </button>
      </div>
    </div>
  )
}

// Composant de notification offline pour PWA
export function OfflineNotification({ 
  isOnline, 
  onRetry 
}: { 
  isOnline: boolean
  onRetry: () => void 
}) {
  if (isOnline) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-orange-500 text-white px-4 py-3 rounded-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">📴</span>
          <div>
            <div className="font-semibold text-sm">Mode hors ligne</div>
            <div className="text-xs opacity-90">Certaines données peuvent être obsolètes</div>
          </div>
        </div>
        
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}