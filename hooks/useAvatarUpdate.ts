// hooks/useAvatarUpdate.ts
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'

export function useAvatarUpdate() {
  const { data: session, update } = useSession()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAvatar = async (newImage: string | null) => {
    if (!session?.user?.id) {
      setError('Utilisateur non connecté')
      return false
    }

    setIsUpdating(true)
    setError(null)

    try {
      // 1. Mettre à jour en base de données
      const response = await axios.put('/api/user/update-avatar', { image: newImage })
      
      console.log('✅ Avatar mis à jour en DB:', response.data)
      
      // 2. Forcer la mise à jour de la session NextAuth
      await update({
        ...session,
        user: {
          ...session.user,
          image: newImage
        }
      })

      console.log('✅ Session NextAuth mise à jour avec nouvel avatar:', newImage)
      return true

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour'
      setError(errorMessage)
      console.error('❌ Erreur mise à jour avatar:', err)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const clearError = () => setError(null)

  return {
    updateAvatar,
    isUpdating,
    error,
    clearError
  }
}