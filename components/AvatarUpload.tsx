// components/AvatarUpload.tsx - Version simple avec les nouveaux IDs
import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, AlertTriangle, User, Palette, Image as ImageIcon } from 'lucide-react'

// Import des constantes (si le fichier lib/avatar-constants.ts existe)
// Sinon, définition locale temporaire
const PRESET_AVATARS = [
  // Sports
  { id: 'avatar_sport_1', emoji: '⚽', bg: 'from-green-400 to-emerald-500', label: 'Football' },
  { id: 'avatar_sport_2', emoji: '🏀', bg: 'from-orange-400 to-red-500', label: 'Basketball' },
  { id: 'avatar_sport_3', emoji: '🎾', bg: 'from-yellow-400 to-orange-500', label: 'Tennis' },
  { id: 'avatar_sport_4', emoji: '🏎️', bg: 'from-blue-400 to-cyan-500', label: 'F1' },
  { id: 'avatar_sport_5', emoji: '🥊', bg: 'from-red-400 to-pink-500', label: 'MMA' },
  { id: 'avatar_sport_6', emoji: '🏉', bg: 'from-purple-400 to-indigo-500', label: 'Rugby' },
  
  // Trophées
  { id: 'avatar_trophy_1', emoji: '🏆', bg: 'from-yellow-400 to-yellow-600', label: 'Champion' },
  { id: 'avatar_trophy_2', emoji: '🥇', bg: 'from-yellow-500 to-orange-500', label: 'Or' },
  { id: 'avatar_trophy_3', emoji: '🥈', bg: 'from-gray-400 to-gray-600', label: 'Argent' },
  { id: 'avatar_trophy_4', emoji: '🥉', bg: 'from-orange-400 to-orange-600', label: 'Bronze' },
  { id: 'avatar_trophy_5', emoji: '⭐', bg: 'from-yellow-300 to-yellow-500', label: 'Étoile' },
  { id: 'avatar_trophy_6', emoji: '🔥', bg: 'from-red-500 to-orange-500', label: 'Feu' },
  
  // Animaux
  { id: 'avatar_animal_1', emoji: '🦁', bg: 'from-yellow-500 to-orange-600', label: 'Lion' },
  { id: 'avatar_animal_2', emoji: '🐺', bg: 'from-gray-500 to-gray-700', label: 'Loup' },
  { id: 'avatar_animal_3', emoji: '🦅', bg: 'from-blue-500 to-blue-700', label: 'Aigle' },
  { id: 'avatar_animal_4', emoji: '🐅', bg: 'from-orange-500 to-red-600', label: 'Tigre' },
  { id: 'avatar_animal_5', emoji: '🐸', bg: 'from-green-400 to-green-600', label: 'Grenouille' },
  { id: 'avatar_animal_6', emoji: '🦈', bg: 'from-blue-400 to-blue-600', label: 'Requin' },
  
  // Expressions
  { id: 'avatar_face_1', emoji: '😎', bg: 'from-gray-400 to-gray-600', label: 'Cool' },
  { id: 'avatar_face_2', emoji: '🤩', bg: 'from-purple-400 to-pink-500', label: 'Star' },
  { id: 'avatar_face_3', emoji: '🔥', bg: 'from-red-400 to-orange-500', label: 'Chaud' },
  { id: 'avatar_face_4', emoji: '💪', bg: 'from-blue-500 to-indigo-600', label: 'Fort' },
  { id: 'avatar_face_5', emoji: '⚡', bg: 'from-yellow-400 to-yellow-600', label: 'Rapide' },
  { id: 'avatar_face_6', emoji: '🎯', bg: 'from-red-500 to-red-700', label: 'Précis' },
]

interface AvatarUploadProps {
  currentImage?: string
  userName: string
  onImageChange: (imageData: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function AvatarUpload({ currentImage, userName, onImageChange, size = 'lg' }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'upload' | 'preset'>('preset')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  // Vérifier si l'image actuelle est un avatar prédéfini
  const getCurrentPresetAvatar = () => {
    if (!currentImage || currentImage.startsWith('data:') || currentImage.startsWith('http')) {
      return null
    }
    return PRESET_AVATARS.find(avatar => avatar.id === currentImage)
  }

  const currentPresetAvatar = getCurrentPresetAvatar()

  // Valider le fichier
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WEBP.'
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Image trop volumineuse (max 5MB)'
    }

    return null
  }

  // Redimensionner l'image
  const resizeImage = (file: File, maxSize: number = 400): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Gérer la sélection de fichier
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setUploading(false)
        return
      }

      const resizedImage = await resizeImage(file)
      setPreview(resizedImage)
      onImageChange(resizedImage)
      setShowAvatarPicker(false)
      
      console.log('✅ Avatar uploadé et redimensionné')
    } catch (err) {
      console.error('❌ Erreur upload avatar:', err)
      setError('Erreur lors du traitement de l\'image')
    } finally {
      setUploading(false)
    }
  }

  // Sélectionner un avatar prédéfini
  const selectPresetAvatar = (avatarId: string) => {
    setPreview(null) // Reset custom image preview
    onImageChange(avatarId) // Envoie l'ID de l'avatar
    setShowAvatarPicker(false)
    console.log('✅ Avatar prédéfini sélectionné:', avatarId)
  }

  // Supprimer l'avatar
  const removeAvatar = () => {
    setPreview(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Générer les initiales pour l'avatar par défaut
  const getInitials = () => {
    return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Générer une couleur basée sur le nom
  const getAvatarColor = () => {
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
    
    const hash = userName.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0)
    return colors[hash % colors.length]
  }

  // Rendre l'avatar selon le type
  const renderAvatar = () => {
    if (preview) {
      // Image uploadée (preview)
      return (
        <img
          src={preview}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      )
    } else if (currentPresetAvatar) {
      // Avatar prédéfini
      return (
        <div className={`w-full h-full bg-gradient-to-br ${currentPresetAvatar.bg} flex items-center justify-center`}>
          <span className={`${textSizes[size]} font-bold`}>
            {currentPresetAvatar.emoji}
          </span>
        </div>
      )
    } else if (currentImage && (currentImage.startsWith('data:') || currentImage.startsWith('http'))) {
      // Image uploadée sauvegardée
      return (
        <img
          src={currentImage}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={() => {
            console.warn('Erreur chargement avatar, fallback vers défaut')
            onImageChange(null)
          }}
        />
      )
    } else {
      // Avatar par défaut (initiales)
      return (
        <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center`}>
          <span className={`${textSizes[size]} font-bold text-white`}>
            {getInitials()}
          </span>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar principal */}
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-slate-800`}>
          {renderAvatar()}
        </div>

        {/* Overlay de modification */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer"
          onClick={() => setShowAvatarPicker(true)}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Bouton de suppression si avatar personnalisé */}
        {(preview || currentPresetAvatar || (currentImage && currentImage.startsWith('data:'))) && (
          <button
            onClick={removeAvatar}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Supprimer l'avatar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bouton principal */}
      

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de sélection d'avatar */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Choisir un avatar
              </h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('preset')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'preset'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Avatars prédéfinis</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload photo</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'preset' ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choisissez un avatar prédéfini parmi nos designs sportifs
                  </p>
                  
                  {/* Grille d'avatars par catégorie */}
                  <div className="space-y-6">
                    {/* Sports */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🏆 Sports</h4>
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_AVATARS.filter(avatar => avatar.id.includes('sport')).map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => selectPresetAvatar(avatar.id)}
                            className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xl hover:scale-110 transition-all duration-200 ${
                              currentImage === avatar.id ? 'ring-4 ring-blue-500' : ''
                            }`}
                            title={avatar.label}
                          >
                            {avatar.emoji}
                            {currentImage === avatar.id && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Trophées */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🏆 Trophées</h4>
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_AVATARS.filter(avatar => avatar.id.includes('trophy')).map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => selectPresetAvatar(avatar.id)}
                            className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xl hover:scale-110 transition-all duration-200 ${
                              currentImage === avatar.id ? 'ring-4 ring-blue-500' : ''
                            }`}
                            title={avatar.label}
                          >
                            {avatar.emoji}
                            {currentImage === avatar.id && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Animaux */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🦁 Mascottes</h4>
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_AVATARS.filter(avatar => avatar.id.includes('animal')).map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => selectPresetAvatar(avatar.id)}
                            className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xl hover:scale-110 transition-all duration-200 ${
                              currentImage === avatar.id ? 'ring-4 ring-blue-500' : ''
                            }`}
                            title={avatar.label}
                          >
                            {avatar.emoji}
                            {currentImage === avatar.id && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expressions */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">😎 Expressions</h4>
                      <div className="grid grid-cols-6 gap-3">
                        {PRESET_AVATARS.filter(avatar => avatar.id.includes('face')).map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => selectPresetAvatar(avatar.id)}
                            className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xl hover:scale-110 transition-all duration-200 ${
                              currentImage === avatar.id ? 'ring-4 ring-blue-500' : ''
                            }`}
                            title={avatar.label}
                          >
                            {avatar.emoji}
                            {currentImage === avatar.id && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 hover:border-blue-400 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Uploader votre photo
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        JPG, PNG ou WEBP (max 5MB)
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Traitement...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Choisir une image</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                          Conditions d'utilisation
                        </p>
                        <ul className="text-orange-700 dark:text-orange-300 space-y-1">
                          <li>• Utilisez uniquement vos propres photos</li>
                          <li>• Ou des images libres de droits</li>
                          <li>• Respectez les autres utilisateurs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={removeAvatar}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Avatar par défaut</span>
                </button>
                
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Terminé</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}