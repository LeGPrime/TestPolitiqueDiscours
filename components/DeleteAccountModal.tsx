// components/DeleteAccountModal.tsx
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Trash2, AlertTriangle, Lock, Type, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userHasPassword: boolean
  userEmail: string
}

export default function DeleteAccountModal({ 
  isOpen, 
  onClose, 
  userHasPassword, 
  userEmail 
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<'warning' | 'confirm' | 'processing'>('warning')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const resetModal = () => {
    setStep('warning')
    setPassword('')
    setConfirmText('')
    setErrors({})
    setShowPassword(false)
    setLoading(false)
  }

  const handleClose = () => {
    if (step !== 'processing') {
      resetModal()
      onClose()
    }
  }

  const handleDeleteAccount = async () => {
    if (step === 'processing') return

    setLoading(true)
    setErrors({})

    try {
      await axios.delete('/api/profile/delete-account', {
        data: {
          password: userHasPassword ? password : undefined,
          confirmText
        }
      })

      setStep('processing')
      
      // Notification de succès
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm'
      notification.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="text-2xl">✅</div>
          <div class="font-semibold">Compte supprimé avec succès</div>
        </div>
      `
      document.body.appendChild(notification)

      // Attendre un peu puis déconnecter
      setTimeout(async () => {
        await signOut({ callbackUrl: '/' })
      }, 2000)

    } catch (error: any) {
      console.error('Erreur suppression:', error)
      
      if (error.response?.data?.field) {
        setErrors({ [error.response.data.field]: error.response.data.error })
      } else {
        setErrors({ general: error.response?.data?.error || 'Erreur lors de la suppression' })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all">
        
        {/* Warning Step */}
        {step === 'warning' && (
          <>
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">⚠️ Suppression de compte</h3>
                  <p className="text-red-100 text-sm">Cette action est irréversible</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-bold text-red-800 mb-3">🗑️ Ce qui sera supprimé définitivement :</h4>
                <ul className="text-sm text-red-700 space-y-2">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Toutes vos notes et commentaires</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Vos relations d'amitié</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Vos équipes suivies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Votre profil et toutes vos données</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-bold text-yellow-800 mb-2">💡 Alternatives à considérer :</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Modifier vos paramètres de confidentialité</li>
                  <li>• Supprimer seulement certaines données</li>
                  <li>• Prendre une pause temporaire</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  ← Annuler
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Continuer →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <>
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">Confirmer la suppression</h3>
                  <p className="text-red-100 text-sm">Étape finale - Vérifications de sécurité</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 text-sm font-medium">❌ {errors.general}</p>
                </div>
              )}

              {/* Vérification mot de passe (si compte local) */}
              {userHasPassword && (
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirmez votre mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Votre mot de passe actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Confirmation textuelle */}
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">
                  <Type className="w-4 h-4 inline mr-2" />
                  Tapez exactement : <span className="font-mono bg-gray-100 px-2 py-1 rounded">SUPPRIMER MON COMPTE</span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono ${
                    errors.confirmText ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="SUPPRIMER MON COMPTE"
                />
                {errors.confirmText && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmText}</p>
                )}
              </div>

              {/* Rappel compte */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Compte :</strong> {userEmail}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('warning')}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || !confirmText || (userHasPassword && !password)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Suppression...</span>
                    </div>
                  ) : (
                    '🗑️ SUPPRIMER DÉFINITIVEMENT'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <h3 className="text-xl font-bold">Suppression en cours...</h3>
                  <p className="text-green-100 text-sm">Déconnexion automatique dans quelques instants</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">✅</div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-gray-900">Compte supprimé avec succès</h4>
                  <p className="text-gray-600">Toutes vos données ont été supprimées de nos serveurs.</p>
                  <p className="text-sm text-gray-500">Redirection en cours...</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}