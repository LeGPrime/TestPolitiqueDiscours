// lib/avatar-constants.ts - Constantes partagées pour les avatars
export const PRESET_AVATARS_DATA = [
  // Sport général
  { id: 'avatar_sport_1', emoji: '⚽', bg: 'from-green-400 to-emerald-500', label: 'Football', category: 'sport' },
  { id: 'avatar_sport_2', emoji: '🏀', bg: 'from-orange-400 to-red-500', label: 'Basketball', category: 'sport' },
  { id: 'avatar_sport_3', emoji: '🎾', bg: 'from-yellow-400 to-orange-500', label: 'Tennis', category: 'sport' },
  { id: 'avatar_sport_4', emoji: '🏎️', bg: 'from-blue-400 to-cyan-500', label: 'F1', category: 'sport' },
  { id: 'avatar_sport_5', emoji: '🥊', bg: 'from-red-400 to-pink-500', label: 'MMA', category: 'sport' },
  { id: 'avatar_sport_6', emoji: '🏉', bg: 'from-purple-400 to-indigo-500', label: 'Rugby', category: 'sport' },
  
  // Trophées et récompenses
  { id: 'avatar_trophy_1', emoji: '🏆', bg: 'from-yellow-400 to-yellow-600', label: 'Champion', category: 'trophy' },
  { id: 'avatar_trophy_2', emoji: '🥇', bg: 'from-yellow-500 to-orange-500', label: 'Or', category: 'trophy' },
  { id: 'avatar_trophy_3', emoji: '🥈', bg: 'from-gray-400 to-gray-600', label: 'Argent', category: 'trophy' },
  { id: 'avatar_trophy_4', emoji: '🥉', bg: 'from-orange-400 to-orange-600', label: 'Bronze', category: 'trophy' },
  { id: 'avatar_trophy_5', emoji: '⭐', bg: 'from-yellow-300 to-yellow-500', label: 'Étoile', category: 'trophy' },
  { id: 'avatar_trophy_6', emoji: '🔥', bg: 'from-red-500 to-orange-500', label: 'Feu', category: 'trophy' },
  
  // Animaux mascotte
  { id: 'avatar_animal_1', emoji: '🦁', bg: 'from-yellow-500 to-orange-600', label: 'Lion', category: 'animal' },
  { id: 'avatar_animal_2', emoji: '🐺', bg: 'from-gray-500 to-gray-700', label: 'Loup', category: 'animal' },
  { id: 'avatar_animal_3', emoji: '🦅', bg: 'from-blue-500 to-blue-700', label: 'Aigle', category: 'animal' },
  { id: 'avatar_animal_4', emoji: '🐅', bg: 'from-orange-500 to-red-600', label: 'Tigre', category: 'animal' },
  { id: 'avatar_animal_5', emoji: '🐸', bg: 'from-green-400 to-green-600', label: 'Grenouille', category: 'animal' },
  { id: 'avatar_animal_6', emoji: '🦈', bg: 'from-blue-400 to-blue-600', label: 'Requin', category: 'animal' },
  
  // Expressions
  { id: 'avatar_face_1', emoji: '😎', bg: 'from-gray-400 to-gray-600', label: 'Cool', category: 'face' },
  { id: 'avatar_face_2', emoji: '🤩', bg: 'from-purple-400 to-pink-500', label: 'Star', category: 'face' },
  { id: 'avatar_face_3', emoji: '🔥', bg: 'from-red-400 to-orange-500', label: 'Chaud', category: 'face' },
  { id: 'avatar_face_4', emoji: '💪', bg: 'from-blue-500 to-indigo-600', label: 'Fort', category: 'face' },
  { id: 'avatar_face_5', emoji: '⚡', bg: 'from-yellow-400 to-yellow-600', label: 'Rapide', category: 'face' },
  { id: 'avatar_face_6', emoji: '🎯', bg: 'from-red-500 to-red-700', label: 'Précis', category: 'face' },
]

// Fonction pour obtenir un avatar par ID
export const getPresetAvatar = (id: string) => {
  return PRESET_AVATARS_DATA.find(avatar => avatar.id === id)
}

// Fonction pour vérifier si un ID est valide
export const isValidPresetAvatar = (id: string) => {
  return PRESET_AVATARS_DATA.some(avatar => avatar.id === id)
}

// Obtenir tous les IDs valides
export const getValidPresetAvatarIds = () => {
  return PRESET_AVATARS_DATA.map(avatar => avatar.id)
}

// Obtenir les avatars par catégorie
export const getAvatarsByCategory = (category: string) => {
  return PRESET_AVATARS_DATA.filter(avatar => avatar.category === category)
}

// Fonction pour déterminer le type d'avatar
export const getAvatarType = (image: string | null) => {
  if (!image) return 'default'
  if (isValidPresetAvatar(image)) return 'preset'
  if (image.startsWith('data:') || image.startsWith('http')) return 'upload'
  return 'unknown'
}

// Couleurs par défaut pour les avatars avec initiales
export const DEFAULT_AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-purple-500 to-purple-600', 
  'from-green-500 to-green-600',
  'from-red-500 to-red-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600'
]

// Fonction pour générer une couleur d'avatar par défaut
export const getDefaultAvatarColor = (name: string) => {
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
  return DEFAULT_AVATAR_COLORS[hash % DEFAULT_AVATAR_COLORS.length]
}

// Fonction pour générer les initiales
export const getInitials = (name: string) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// Hook pour les composants React
export const useAvatarData = (image: string | null) => {
  const type = getAvatarType(image)
  const presetData = type === 'preset' ? getPresetAvatar(image!) : null
  
  return {
    type,
    isPreset: type === 'preset',
    isUpload: type === 'upload',
    isDefault: type === 'default',
    presetData
  }
}