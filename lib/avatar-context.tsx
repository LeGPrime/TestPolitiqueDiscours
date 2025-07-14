// lib/avatar-context.tsx - Context pour gérer l'avatar en temps réel
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface AvatarContextType {
  currentAvatar: string | null
  updateAvatar: (newAvatar: string | null) => void
  isLoading: boolean
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined)

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialiser avec l'avatar de session
  useEffect(() => {
    if (session?.user?.image) {
      setCurrentAvatar(session.user.image)
    }
  }, [session?.user?.image])

  const updateAvatar = async (newAvatar: string | null) => {
    setIsLoading(true)
    
    try {
      // Mettre à jour l'état local immédiatement
      setCurrentAvatar(newAvatar)
      
      // Puis mettre à jour en base
      const response = await fetch('/api/user/update-avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: newAvatar }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      console.log('✅ Avatar mis à jour:', newAvatar)
    } catch (error) {
      console.error('❌ Erreur mise à jour avatar:', error)
      // Revenir à l'ancien avatar en cas d'erreur
      setCurrentAvatar(session?.user?.image || null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AvatarContext.Provider value={{ currentAvatar, updateAvatar, isLoading }}>
      {children}
    </AvatarContext.Provider>
  )
}

export function useAvatar() {
  const context = useContext(AvatarContext)
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider')
  }
  return context
}