// components/AvatarDisplay.tsx - Version mise à jour avec session tracking
import React from 'react'
import { useSession } from 'next-auth/react'

// AVATARS PRÉDÉFINIS - EXACTEMENT LES MÊMES IDs que dans AvatarUpload
const PRESET_AVATARS = {
  // Sports
  'avatar_sport_1': { emoji: '⚽', bg: 'from-green-400 to-emerald-500' },
  'avatar_sport_2': { emoji: '🏀', bg: 'from-orange-400 to-red-500' },
  'avatar_sport_3': { emoji: '🎾', bg: 'from-yellow-400 to-orange-500' },
  'avatar_sport_4': { emoji: '🏎️', bg: 'from-blue-400 to-cyan-500' },
  'avatar_sport_5': { emoji: '🥊', bg: 'from-red-400 to-pink-500' },
  'avatar_sport_6': { emoji: '🏉', bg: 'from-purple-400 to-indigo-500' },
  
  // Trophées
  'avatar_trophy_1': { emoji: '🏆', bg: 'from-yellow-400 to-yellow-600' },
  'avatar_trophy_2': { emoji: '🥇', bg: 'from-yellow-500 to-orange-500' },
  'avatar_trophy_3': { emoji: '🥈', bg: 'from-gray-400 to-gray-600' },
  'avatar_trophy_4': { emoji: '🥉', bg: 'from-orange-400 to-orange-600' },
  'avatar_trophy_5': { emoji: '⭐', bg: 'from-yellow-300 to-yellow-500' },
  'avatar_trophy_6': { emoji: '🔥', bg: 'from-red-500 to-orange-500' },
  
  // Animaux
  'avatar_animal_1': { emoji: '🦁', bg: 'from-yellow-500 to-orange-600' },
  'avatar_animal_2': { emoji: '🐺', bg: 'from-gray-500 to-gray-700' },
  'avatar_animal_3': { emoji: '🦅', bg: 'from-blue-500 to-blue-700' },
  'avatar_animal_4': { emoji: '🐅', bg: 'from-orange-500 to-red-600' },
  'avatar_animal_5': { emoji: '🐸', bg: 'from-green-400 to-green-600' },
  'avatar_animal_6': { emoji: '🦈', bg: 'from-blue-400 to-blue-600' },
  
  // Expressions
  'avatar_face_1': { emoji: '😎', bg: 'from-gray-400 to-gray-600' },
  'avatar_face_2': { emoji: '🤩', bg: 'from-purple-400 to-pink-500' },
  'avatar_face_3': { emoji: '🔥', bg: 'from-red-400 to-orange-500' },
  'avatar_face_4': { emoji: '💪', bg: 'from-blue-500 to-indigo-600' },
  'avatar_face_5': { emoji: '⚡', bg: 'from-yellow-400 to-yellow-600' },
  'avatar_face_6': { emoji: '🎯', bg: 'from-red-500 to-red-700' },
}

interface AvatarDisplayProps {
  image?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBorder?: boolean
  onClick?: () => void
  useSessionImage?: boolean // 🆕 Option pour utiliser l'image de session
}

export default function AvatarDisplay({ 
  image, 
  name, 
  size = 'md', 
  className = '', 
  showBorder = true,
  onClick,
  useSessionImage = false // 🆕 Par défaut false pour rétro-compatibilité
}: AvatarDisplayProps) {
  
  const { data: session } = useSession() // 🆕 Hook pour accéder à la session
  
  // 🆕 Utiliser l'image de session si demandé et disponible
  const effectiveImage = useSessionImage && session?.user?.image 
    ? session.user.image 
    : image

  // DEBUG: Logguer les informations pour identifier le problème
  React.useEffect(() => {
    if (useSessionImage) {
      console.log('🔍 AvatarDisplay Session Debug:', {
        sessionImage: session?.user?.image,
        propImage: image,
        effectiveImage,
        name,
        userName: session?.user?.name,
        isPresetAvatar: !!PRESET_AVATARS[effectiveImage as keyof typeof PRESET_AVATARS],
        isDataURL: effectiveImage?.startsWith('data:'),
        isHttpURL: effectiveImage?.startsWith('http'),
        presetData: PRESET_AVATARS[effectiveImage as keyof typeof PRESET_AVATARS]
      })
    }
  }, [effectiveImage, image, name, session, useSessionImage])
  
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const borderClasses = showBorder 
    ? 'border-2 border-white dark:border-slate-800 shadow-sm' 
    : ''

  // Générer les initiales
  const getInitials = () => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Générer une couleur basée sur le nom
  const getDefaultAvatarColor = () => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-green-500 to-green-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600'
    ]
    
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    return colors[hash % colors.length]
  }

  // Rendre le contenu de l'avatar
  const renderAvatarContent = () => {
    if (!effectiveImage) {
      // Avatar par défaut (initiales)
      console.log('📝 Rendu avatar par défaut pour:', name)
      return (
        <div className={`w-full h-full bg-gradient-to-br ${getDefaultAvatarColor()} flex items-center justify-center`}>
          <span className={`${textSizes[size]} font-bold text-white`}>
            {getInitials()}
          </span>
        </div>
      )
    }

    // Vérifier si c'est un avatar prédéfini
    const presetAvatar = PRESET_AVATARS[effectiveImage as keyof typeof PRESET_AVATARS]
    if (presetAvatar) {
      console.log('🎨 Rendu avatar prédéfini:', effectiveImage, presetAvatar)
      return (
        <div className={`w-full h-full bg-gradient-to-br ${presetAvatar.bg} flex items-center justify-center`}>
          <span className={`${textSizes[size]} font-bold`}>
            {presetAvatar.emoji}
          </span>
        </div>
      )
    }

    // Image uploadée
    if (effectiveImage.startsWith('data:') || effectiveImage.startsWith('http')) {
      console.log('🖼️ Rendu image uploadée pour:', name)
      return (
        <>
          <img
            src={effectiveImage}
            alt={`Avatar de ${name}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback vers avatar par défaut si l'image ne charge pas
              console.warn('❌ Erreur chargement avatar, affichage fallback pour:', name)
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          {/* Fallback caché qui s'affiche si l'image échoue */}
          <div className={`hidden w-full h-full bg-gradient-to-br ${getDefaultAvatarColor()} flex items-center justify-center`}>
            <span className={`${textSizes[size]} font-bold text-white`}>
              {getInitials()}
            </span>
          </div>
        </>
      )
    }

    // Type d'avatar non reconnu - fallback vers avatar par défaut
    console.warn('⚠️ Type d\'avatar non reconnu, fallback vers défaut:', effectiveImage)
    return (
      <div className={`w-full h-full bg-gradient-to-br ${getDefaultAvatarColor()} flex items-center justify-center`}>
        <span className={`${textSizes[size]} font-bold text-white`}>
          {getInitials()}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        overflow-hidden 
        ${borderClasses}
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
      title={name}
    >
      {renderAvatarContent()}
    </div>
  )
}