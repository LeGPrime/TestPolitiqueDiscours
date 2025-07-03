import { useState } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface MobileSearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  showFilter?: boolean
  onFilterClick?: () => void
  filterActive?: boolean
}

export function MobileSearchInput({
  placeholder = "Rechercher...",
  value,
  onChange,
  onSearch,
  showFilter = false,
  onFilterClick,
  filterActive = false
}: MobileSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  const clearSearch = () => {
    onChange('')
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'ring-2 ring-blue-500' : ''
      }`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
          {value && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {showFilter && (
          <button
            type="button"
            onClick={onFilterClick}
            className={`ml-3 p-3 rounded-xl border transition-all duration-200 touch-target ${
              filterActive
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  )
}