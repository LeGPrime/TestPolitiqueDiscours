import { useState } from 'react'
import { useRouter } from 'next/router'

export default function SecretLogin() {
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'MonAccesSecret2025!') {
      document.cookie = `secret_access=MonAccesSecret2025!; path=/; max-age=${30*24*60*60}`
      router.push('/')
    } else {
      alert('❌ Accès refusé')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-xl border border-red-500 max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-400 mb-2">🔒 ACCÈS RESTREINT</h1>
          <p className="text-gray-400 text-sm">Application privée</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe secret..."
            className="w-full p-4 bg-black border border-gray-700 rounded-lg text-white mb-4 focus:border-red-500"
            autoFocus
            required
          />
          <button 
            type="submit"
            className="w-full bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 font-bold"
          >
            🚀 ACCÉDER
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-xs">⚠️ Accès non autorisé interdit</p>
        </div>
      </div>
    </div>
  )
}