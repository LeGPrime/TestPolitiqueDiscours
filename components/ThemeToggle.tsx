// components/ThemeToggle.tsx - Version sécurisée
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme-context'

export default function ThemeToggle() {
  try {
    const { theme, toggleTheme } = useTheme()
    
    return (
      <button
        onClick={toggleTheme}
        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    )
  } catch (error) {
    // Fallback si le ThemeProvider n'est pas disponible
    console.warn('ThemeToggle: ThemeProvider not found, using fallback')
    return (
      <button
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Changer de thème"
        onClick={() => {
          // Simple fallback toggle
          const root = document.documentElement
          const isDark = root.classList.contains('dark')
          root.classList.toggle('dark', !isDark)
          root.classList.toggle('light', isDark)
        }}
      >
        <Sun className="w-5 h-5" />
      </button>
    )
  }
}