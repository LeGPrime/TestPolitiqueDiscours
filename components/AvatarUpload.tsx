// components/AvatarUpload.tsx - Composant d'upload d'avatar
import { useState, useRef } from 'react'
import { Camera, Upload, X, Check, AlertTriangle, User } from 'lucide-react'

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
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24', 
    lg: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  // Valider le fichier
  const validateFile = (file: File): string | null => {
    // Types autorisés
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WEBP.'
    }

    // Taille max 5MB
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
        // Calculer les nouvelles dimensions
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

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convertir en base64
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
      // Valider le fichier
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setUploading(false)
        return
      }

      // Redimensionner et convertir
      const resizedImage = await resizeImage(file)
      setPreview(resizedImage)
      onImageChange(resizedImage)
      
      console.log('✅ Avatar uploadé et redimensionné')
    } catch (err) {
      console.error('❌ Erreur upload avatar:', err)
      setError('Erreur lors du traitement de l\'image')
    } finally {
      setUploading(false)
    }
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

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar principal */}
      <div className="relative group">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 bg-gradient-to-br ${getAvatarColor()}`}>
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className={`${textSizes[size]} font-bold text-white`}>
                {getInitials()}
              </span>
            </div>
          )}
        </div>

        {/* Overlay de modification */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className={`${iconSizes[size]} text-white`} />
          </div>
        </div>

        {/* Bouton de suppression si image personnalisée */}
        {preview && (
          <button
            onClick={removeAvatar}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Supprimer l'avatar"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex space-x-3">
        <button
          onClick={() => setShowDisclaimer(true)}
          disabled={uploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{preview ? 'Changer' : 'Ajouter'} photo</span>
        </button>

        {preview && (
          <button
            onClick={removeAvatar}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Avatar auto</span>
          </button>
        )}
      </div>

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

      {/* Modal disclaimer */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Photo de profil
              </h3>
            </div>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p>En uploadant une photo, vous certifiez que :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cette photo vous appartient OU</li>
                <li>Vous avez l'autorisation de la personne photographiée OU</li>
                <li>Cette photo est libre de droits</li>
              </ul>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Les photos inappropriées ou sans autorisation seront supprimées
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowDisclaimer(false)
                  fileInputRef.current?.click()
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                J'accepte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}