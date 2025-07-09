// components/MatchListModal.tsx
import { useState, useEffect } from 'react'
import { X, Save, Eye, EyeOff, Globe, Lock } from 'lucide-react'

interface MatchListModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  mode: 'create' | 'edit'
  initialData?: any
}

const EMOJI_OPTIONS = [
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🏎️',
  '🏆', '🥇', '🥈', '🥉', '🎯', '🎳', '🎮', '🕹️', '🎲', '🃏',
  '❤️', '💙', '💚', '💜', '🧡', '💛', '🖤', '🤍', '🔥', '⭐',
  '👑', '💎', '🌟', '✨', '💫', '⚡', '🌈', '🎊', '🎉', '🎁'
]

const COLOR_OPTIONS = [
  { name: 'Bleu', value: 'blue', class: 'bg-blue-500' },
  { name: 'Rouge', value: 'red', class: 'bg-red-500' },
  { name: 'Vert', value: 'green', class: 'bg-green-500' },
  { name: 'Violet', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Jaune', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Rose', value: 'pink', class: 'bg-pink-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
  { name: 'Gris', value: 'gray', class: 'bg-gray-500' }
]

export default function MatchListModal({ isOpen, onClose, onSave, mode, initialData }: MatchListModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    color: '',
    emoji: ''
  })
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          isPublic: initialData.isPublic ?? true,
          color: initialData.color || '',
          emoji: initialData.emoji || ''
        })
      } else {
        setFormData({
          name: '',
          description: '',
          isPublic: true,
          color: '',
          emoji: ''
        })
      }
    }
  }, [isOpen, mode, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Le nom de la liste est obligatoire')
      return
    }

    try {
      setSaving(true)
      await onSave(formData)
    } catch (error) {
      // L'erreur est gérée dans le composant parent
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      onClose()
      setShowEmojiPicker(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? '✨ Créer une liste' : '✏️ Modifier la liste'}
          </h3>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Nom de la liste *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="ex: Mes meilleurs matchs de Messi"
              maxLength={100}
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formData.name.length}/100 caractères
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description (optionnelle)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              placeholder="Décrivez votre liste..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {formData.description.length}/500 caractères
            </div>
          </div>

          {/* Emoji et couleur */}
          <div className="grid grid-cols-2 gap-4">
            {/* Emoji */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Emoji
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-center"
                >
                  {formData.emoji ? (
                    <span className="text-2xl">{formData.emoji}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Choisir</span>
                  )}
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg z-10 p-4 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, emoji: '' }))
                          setShowEmojiPicker(false)
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-xs text-gray-500"
                      >
                        Aucun
                      </button>
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, emoji }))
                            setShowEmojiPicker(false)
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg text-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Couleur
              </label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: '' }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                    !formData.color 
                      ? 'border-blue-500 bg-gray-200 dark:bg-slate-600' 
                      : 'border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-600'
                  }`}
                  title="Défaut"
                >
                  <X className="w-4 h-4 mx-auto text-gray-500" />
                </button>
                {COLOR_OPTIONS.slice(0, 4).map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-colors ${color.class} ${
                      formData.color === color.value 
                        ? 'border-gray-900 dark:border-white scale-110' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {COLOR_OPTIONS.slice(4).map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-colors ${color.class} ${
                      formData.color === color.value 
                        ? 'border-gray-900 dark:border-white scale-110' 
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Visibilité
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Publique</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Visible par tous les utilisateurs
                    </div>
                  </div>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.isPublic}
                  onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Privée</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Visible uniquement par vous
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          {(formData.name || formData.emoji || formData.color) && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Aperçu
              </label>
              <div className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 bg-gray-50 dark:bg-slate-700">
                <div className={`h-1 rounded-full mb-3 ${
                  formData.color ? `bg-${formData.color}-500` : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}></div>
                <div className="flex items-center space-x-2">
                  {formData.emoji && <span className="text-lg">{formData.emoji}</span>}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formData.name || 'Nom de la liste'}
                  </span>
                  {formData.isPublic ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                {formData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{mode === 'create' ? 'Créer' : 'Sauvegarder'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}