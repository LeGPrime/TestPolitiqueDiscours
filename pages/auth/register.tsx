import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  User,
  Mail,
  Lock,
  Trophy,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react'
import axios from 'axios'

export default function Register() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setErrors({})

    try {
      await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })

      setSuccess(true)
      
      // Auto-connexion après inscription
      setTimeout(async () => {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (result?.ok) {
          // 🆕 Rediriger vers l'onboarding au lieu de la homepage
          router.push('/onboarding?from=register')
        }
      }, 2000) // Augmenté à 2s pour laisser le temps de voir le succès

    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue'
      setErrors({ general: message })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte créé ! 🎉</h1>
          <p className="text-gray-600 mb-4">
            Bienvenue sur Sporating ! Connexion en cours...
          </p>
          <p className="text-sm text-blue-600 mb-4">
            ✨ Nous allons maintenant personnaliser votre expérience
          </p>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Redirection vers la configuration...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Section */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 bg-gradient-to-br from-green-600 to-blue-700">
          <div className="max-w-md text-white">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold">Sporating</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Rejoignez la communauté
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Créez votre compte et commencez à noter vos matchs de sport préférés
            </p>

            <div className="space-y-4">
              {[
                '🚀 Inscription rapide et gratuite',
                '⭐ Notez tous les matchs que vous voulez',
                '📊 Suivez vos statistiques personnelles',
                '🏆 Découvrez les avis de la communauté',
                '✨ Configuration personnalisée après inscription'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-green-100">{feature}</span>
                </div>
              ))}
            </div>

            {/* 🆕 Section onboarding preview */}
            <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold text-yellow-100">Après inscription</span>
              </div>
              <p className="text-white/90 text-sm">
                Personnalisez votre profil en 4 étapes simples : vos infos, vos sports favoris, 
                votre avatar et vos objectifs. Entièrement optionnel !
              </p>
            </div>
          </div>
        </div>

        {/* Right Section - Register Form */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Sporating</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Créer un compte
              </h2>
              <p className="text-gray-600">
                Rejoignez Sporating en quelques secondes
              </p>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Votre nom"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="votre@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 🆕 Info onboarding */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">Que se passe-t-il après ?</h4>
                    <p className="text-blue-800 text-xs mt-1">
                      Après la création de votre compte, nous vous proposons 4 étapes simples pour 
                      personnaliser votre expérience. Vous pouvez les ignorer si vous préférez !
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>

            {/* 🆕 Aperçu des étapes onboarding */}
            <div className="mt-8 lg:hidden">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-center">🎯 Étapes de personnalisation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-gray-700">Vos informations de base</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-gray-700">Vos sports et équipes favorites</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-gray-700">Avatar et préférences</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <span className="text-gray-700">Vos objectifs sur Sporating</span>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <span className="text-xs text-green-600 font-medium">✅ Entièrement optionnel - Vous pouvez tout ignorer !</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}