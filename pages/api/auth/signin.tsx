// pages/auth/signin.tsx - Version sans GitHub
import { useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Mail,
  Lock,
  Trophy,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Section - Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="max-w-md text-white">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold">SPORATING</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Notez vos matchs préférés
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez la communauté des passionnés de sport et partagez vos avis sur les meilleurs matchs !
            </p>

            <div className="space-y-4">
              {[
                '⭐ Notez les matchs de 1 à 5 étoiles',
                '🏆 Découvrez les tops de la communauté',
                '👥 Suivez vos amis et leurs avis',
                '⚽ Accès aux derniers matchs en temps réel'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                  <span className="text-blue-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Sign In Form */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">SPORATING</span>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Connexion
              </h2>
              <p className="text-gray-600">
                Connectez-vous pour noter vos matchs
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

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
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Info supplémentaire */}
            <div className="mt-8 text-center">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">🔒 Pourquoi créer un compte ?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Sauvegardez vos notes personnelles</li>
                  <li>• Suivez vos statistiques de notation</li>
                  <li>• Connectez-vous avec d'autres fans</li>
                  <li>• Accédez à des fonctionnalités exclusives</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
