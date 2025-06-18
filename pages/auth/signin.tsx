import { useState } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Github,
  Mail,
  Lock,
  Trophy,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  type: string
}

interface SignInPageProps {
  providers: Record<string, Provider>
}

export default function SignIn({ providers }: SignInPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('credentials')
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
      setLoading(null)
    }
  }

  const handleOAuthSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl: '/' })
    } catch (error) {
      console.error('Erreur OAuth:', error)
      setLoading(null)
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
              <span className="text-3xl font-bold">FootRate</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">
              Notez vos matchs préférés
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez la communauté des passionnés de football et partagez vos avis sur les meilleurs matchs
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

        {/* Right Section - Sign In Forms */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">FootRate</span>
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
            <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
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
                disabled={loading === 'credentials'}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading === 'credentials' ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              {Object.values(providers)
                .filter(provider => provider.id !== 'credentials')
                .map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleOAuthSignIn(provider.id)}
                  disabled={loading === provider.id}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading === provider.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Github className="w-5 h-5" />
                      <span>Continuer avec {provider.name}</span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Créer un compte
                </Link>
              </p>
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

  const providers = await getProviders()

  return {
    props: {
      providers: providers ?? {},
    },
  }
}
