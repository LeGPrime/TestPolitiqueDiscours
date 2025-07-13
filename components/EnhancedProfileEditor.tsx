// components/EnhancedProfileEditor.tsx - Éditeur de profil avancé
import { useState } from 'react'
import { Save, X, Camera, MapPin, Heart, Star, Calendar, Globe, Trophy, User, Eye, EyeOff } from 'lucide-react'

interface ProfileField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'visibility'
  value: any
  placeholder?: string
  options?: { value: string, label: string }[]
  maxLength?: number
  visible?: boolean
  icon?: any
}

interface EnhancedProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData: any
}

export default function EnhancedProfileEditor({ isOpen, onClose, onSave, initialData }: EnhancedProfileEditorProps) {
  const [profileData, setProfileData] = useState({
    // Informations de base
    name: initialData.name || '',
    username: initialData.username || '',
    bio: initialData.bio || '',
    location: initialData.location || '',
    
    // Nouvelles informations personnelles
    age: initialData.age || '',
    occupation: initialData.occupation || '',
    favoriteClub: initialData.favoriteClub || '',
    favoriteTennisPlayer: initialData.favoriteTennisPlayer || '',
    favoriteF1Driver: initialData.favoriteF1Driver || '',
    favoriteBasketballTeam: initialData.favoriteBasketballTeam || '',
    profileImage: initialData.profileImage || null,
    
    // Préférences sportives
    preferredSports: initialData.preferredSports || [],
    watchingHabits: initialData.watchingHabits || '',
    
    // Langues parlées
    languages: initialData.languages || [],
    
    // Visibilité des champs
    visibility: {
      location: initialData.visibility?.location ?? true,
      age: initialData.visibility?.age ?? false,
      occupation: initialData.visibility?.occupation ?? false,
      favoriteClub: initialData.visibility?.favoriteClub ?? true,
      favoriteTennisPlayer: initialData.visibility?.favoriteTennisPlayer ?? true,
      favoriteF1Driver: initialData.visibility?.favoriteF1Driver ?? true,
      favoriteBasketballTeam: initialData.visibility?.favoriteBasketballTeam ?? true,
      ...initialData.visibility
    }
  })

  const [saving, setSaving] = useState(false)
  const [profileImage, setProfileImage] = useState(initialData.profileImage || null)

  const profileFields: ProfileField[] = [
    // Informations de base
    { key: 'name', label: 'Nom complet', type: 'text', value: profileData.name, placeholder: 'Votre nom complet', maxLength: 100, icon: User },
    { key: 'username', label: 'Nom d\'utilisateur', type: 'text', value: profileData.username, placeholder: 'votrenom', maxLength: 30, icon: User },
    { key: 'bio', label: 'Biographie', type: 'textarea', value: profileData.bio, placeholder: 'Parlez-nous de vous...', maxLength: 300, icon: User },
    
    // Localisation
    { key: 'location', label: 'Localisation', type: 'text', value: profileData.location, placeholder: 'Paris, France', visible: profileData.visibility.location, icon: MapPin },
    { key: 'age', label: 'Âge', type: 'text', value: profileData.age, placeholder: '25', visible: profileData.visibility.age, icon: Calendar },
    { key: 'occupation', label: 'Profession', type: 'text', value: profileData.occupation, placeholder: 'Étudiant, Développeur...', visible: profileData.visibility.occupation, icon: User },
    
    // Sports favoris
    { key: 'favoriteClub', label: 'Équipe de foot favorite', type: 'text', value: profileData.favoriteClub, placeholder: 'PSG, Real Madrid...', visible: profileData.visibility.favoriteClub, icon: Heart },
    { key: 'favoriteBasketballTeam', label: 'Équipe de basket favorite', type: 'text', value: profileData.favoriteBasketballTeam, placeholder: 'Lakers, Warriors...', visible: profileData.visibility.favoriteBasketballTeam, icon: Heart },
    { key: 'favoriteTennisPlayer', label: 'Tennisman préféré', type: 'select', value: profileData.favoriteTennisPlayer, visible: profileData.visibility.favoriteTennisPlayer, icon: Star, options: [
      { value: '', label: 'Aucun' },
      // Joueurs actuels
      { value: 'djokovic', label: 'Novak Djokovic' },
      { value: 'alcaraz', label: 'Carlos Alcaraz' },
      { value: 'medvedev', label: 'Daniil Medvedev' },
      { value: 'tsitsipas', label: 'Stefanos Tsitsipas' },
      { value: 'zverev', label: 'Alexander Zverev' },
      { value: 'rublev', label: 'Andrey Rublev' },
      { value: 'sinner', label: 'Jannik Sinner' },
      { value: 'fritz', label: 'Taylor Fritz' },
      { value: 'auger-aliassime', label: 'Félix Auger-Aliassime' },
      { value: 'tiafoe', label: 'Frances Tiafoe' },
      // Légendes
      { value: 'nadal', label: 'Rafael Nadal' },
      { value: 'federer', label: 'Roger Federer' },
      { value: 'murray', label: 'Andy Murray' },
      { value: 'wawrinka', label: 'Stan Wawrinka' },
      { value: 'gasquet', label: 'Richard Gasquet' },
      { value: 'monfils', label: 'Gaël Monfils' },
      // Femmes actuelles
      { value: 'swiatek', label: 'Iga Swiatek' },
      { value: 'sabalenka', label: 'Aryna Sabalenka' },
      { value: 'gauff', label: 'Coco Gauff' },
      { value: 'rybakina', label: 'Elena Rybakina' },
      { value: 'jabeur', label: 'Ons Jabeur' },
      { value: 'pegula', label: 'Jessica Pegula' },
      { value: 'garcia', label: 'Caroline Garcia' },
      // Légendes féminines
      { value: 'serena', label: 'Serena Williams' },
      { value: 'venus', label: 'Venus Williams' },
      { value: 'sharapova', label: 'Maria Sharapova' },
      { value: 'henin', label: 'Justine Henin' },
      { value: 'mauresmo', label: 'Amélie Mauresmo' }
    ]},
    { key: 'favoriteF1Driver', label: 'Pilote F1 préféré', type: 'select', value: profileData.favoriteF1Driver, visible: profileData.visibility.favoriteF1Driver, icon: Star, options: [
      { value: '', label: 'Aucun' },
      // Pilotes actuels
      { value: 'verstappen', label: 'Max Verstappen' },
      { value: 'hamilton', label: 'Lewis Hamilton' },
      { value: 'leclerc', label: 'Charles Leclerc' },
      { value: 'norris', label: 'Lando Norris' },
      { value: 'russell', label: 'George Russell' },
      { value: 'sainz', label: 'Carlos Sainz Jr.' },
      { value: 'perez', label: 'Sergio Pérez' },
      { value: 'alonso', label: 'Fernando Alonso' },
      { value: 'ocon', label: 'Esteban Ocon' },
      { value: 'gasly', label: 'Pierre Gasly' },
      { value: 'stroll', label: 'Lance Stroll' },
      { value: 'tsunoda', label: 'Yuki Tsunoda' },
      { value: 'albon', label: 'Alexander Albon' },
      { value: 'bottas', label: 'Valtteri Bottas' },
      { value: 'zhou', label: 'Zhou Guanyu' },
      // Légendes
      { value: 'schumacher', label: 'Michael Schumacher' },
      { value: 'senna', label: 'Ayrton Senna' },
      { value: 'prost', label: 'Alain Prost' },
      { value: 'vettel', label: 'Sebastian Vettel' },
      { value: 'raikkonen', label: 'Kimi Räikkönen' },
      { value: 'button', label: 'Jenson Button' },
      { value: 'rosberg', label: 'Nico Rosberg' },
      { value: 'massa', label: 'Felipe Massa' },
      { value: 'webber', label: 'Mark Webber' },
      { value: 'ricciardo', label: 'Daniel Ricciardo' }
    ]},
    
    // Préférences
    { key: 'preferredSports', label: 'Sports préférés', type: 'multiselect', value: profileData.preferredSports, options: [
      { value: 'football', label: '⚽ Football' },
      { value: 'basketball', label: '🏀 Basketball' },
      { value: 'tennis', label: '🎾 Tennis' },
      { value: 'f1', label: '🏎️ Formule 1' },
      { value: 'mma', label: '🥊 MMA' },
      { value: 'rugby', label: '🏉 Rugby' }
    ]},
    { key: 'watchingHabits', label: 'Habitudes de visionnage', type: 'select', value: profileData.watchingHabits, options: [
      { value: '', label: 'Non spécifié' },
      { value: 'casual', label: 'Fan occasionnel' },
      { value: 'regular', label: 'Fan régulier' },
      { value: 'hardcore', label: 'Fan hardcore' },
      { value: 'analyst', label: 'Analyste/Expert' }
    ]},
    { key: 'languages', label: 'Langues parlées', type: 'multiselect', value: profileData.languages, options: [
      { value: 'fr', label: '🇫🇷 Français' },
      { value: 'en', label: '🇺🇸 Anglais' },
      { value: 'es', label: '🇪🇸 Espagnol' },
      { value: 'de', label: '🇩🇪 Allemand' },
      { value: 'it', label: '🇮🇹 Italien' },
      { value: 'pt', label: '🇵🇹 Portugais' }
    ]}
  ]

  const updateField = (key: string, value: any) => {
    setProfileData(prev => ({ ...prev, [key]: value }))
  }

  const toggleVisibility = (key: string) => {
    setProfileData(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [key]: !prev.visibility[key]
      }
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille de l\'image ne doit pas dépasser 5MB')
        return
      }
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setProfileImage(imageUrl)
        // Mettre à jour les données du profil
        setProfileData(prev => ({ ...prev, profileImage: imageUrl }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
    setProfileData(prev => ({ ...prev, profileImage: null }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(profileData)
      onClose()
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Personnaliser mon profil
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Rendez votre profil unique et personnalisé
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 sm:space-y-8">
          {/* Photo de profil */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto overflow-hidden">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profileData.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-image-upload"
              />
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors cursor-pointer"
                title="Changer la photo de profil"
              >
                <Camera className="w-4 h-4" />
              </label>
              {profileImage && (
                <button
                  onClick={removeProfileImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                  title="Supprimer la photo"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {profileImage ? 'Cliquez sur l\'appareil photo pour changer' : 'Cliquez pour ajouter une photo'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              JPG, PNG, GIF - Max 5MB
            </p>
          </div>

          {/* Formulaire organisé par sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Informations de base */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
                Informations de base
              </h3>
              
              {profileFields.filter(field => ['name', 'username', 'bio'].includes(field.key)).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      maxLength={field.maxLength}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  )}
                  {field.maxLength && (
                    <div className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/{field.maxLength}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Informations personnelles */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
                Informations personnelles
              </h3>
              
              {profileFields.filter(field => ['location', 'age', 'occupation'].includes(field.key)).map(field => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      {field.icon && <field.icon className="w-4 h-4" />}
                      <span>{field.label}</span>
                    </label>
                    <button
                      onClick={() => toggleVisibility(field.key)}
                      className={`p-1 rounded transition-colors ${
                        profileData.visibility[field.key]
                          ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={profileData.visibility[field.key] ? 'Visible sur le profil' : 'Masqué du profil'}
                    >
                      {profileData.visibility[field.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sports favoris */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
              Sports & Préférences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileFields.filter(field => ['favoriteClub', 'favoriteBasketballTeam', 'favoriteTennisPlayer', 'favoriteF1Driver'].includes(field.key)).map(field => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                      {field.icon && <field.icon className="w-4 h-4" />}
                      <span>{field.label}</span>
                    </label>
                    <button
                      onClick={() => toggleVisibility(field.key)}
                      className={`p-1 rounded transition-colors ${
                        profileData.visibility[field.key]
                          ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {profileData.visibility[field.key] ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {field.type === 'select' ? (
                    <select
                      value={field.value}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    >
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Sports préférés - Multiselect */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sports préférés
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profileFields.find(f => f.key === 'preferredSports')?.options?.map(sport => (
                  <label key={sport.value} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.preferredSports.includes(sport.value)}
                      onChange={(e) => {
                        const newSports = e.target.checked
                          ? [...profileData.preferredSports, sport.value]
                          : profileData.preferredSports.filter((s: string) => s !== sport.value)
                        updateField('preferredSports', newSports)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{sport.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Habitudes de visionnage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Habitudes de visionnage
              </label>
              <select
                value={profileData.watchingHabits}
                onChange={(e) => updateField('watchingHabits', e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                {profileFields.find(f => f.key === 'watchingHabits')?.options?.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Langues parlées */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Langues parlées
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profileFields.find(f => f.key === 'languages')?.options?.map(language => (
                  <label key={language.value} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.languages.includes(language.value)}
                      onChange={(e) => {
                        const newLanguages = e.target.checked
                          ? [...profileData.languages, language.value]
                          : profileData.languages.filter((l: string) => l !== language.value)
                        updateField('languages', newLanguages)
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{language.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Prévisualisation */}
          <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Aperçu de votre profil
            </h3>
            <div className="space-y-3 text-sm">
              {profileData.name && (
                <div><strong>Nom:</strong> {profileData.name}</div>
              )}
              {profileData.username && (
                <div><strong>Username:</strong> @{profileData.username}</div>
              )}
              {profileData.bio && (
                <div><strong>Bio:</strong> {profileData.bio}</div>
              )}
              {profileData.location && profileData.visibility.location && (
                <div><strong>📍 Localisation:</strong> {profileData.location}</div>
              )}
              {profileData.age && profileData.visibility.age && (
                <div><strong>🎂 Âge:</strong> {profileData.age} ans</div>
              )}
              {profileData.occupation && profileData.visibility.occupation && (
                <div><strong>💼 Profession:</strong> {profileData.occupation}</div>
              )}
              {profileData.favoriteClub && profileData.visibility.favoriteClub && (
                <div><strong>⚽ Équipe favorite:</strong> {profileData.favoriteClub}</div>
              )}
              {profileData.favoriteBasketballTeam && profileData.visibility.favoriteBasketballTeam && (
                <div><strong>🏀 Équipe basket:</strong> {profileData.favoriteBasketballTeam}</div>
              )}
              {profileData.favoriteTennisPlayer && profileData.visibility.favoriteTennisPlayer && (
                <div><strong>🎾 Tennisman préféré:</strong> {profileFields.find(f => f.key === 'favoriteTennisPlayer')?.options?.find(o => o.value === profileData.favoriteTennisPlayer)?.label}</div>
              )}
              {profileData.favoriteF1Driver && profileData.visibility.favoriteF1Driver && (
                <div><strong>🏎️ Pilote F1 préféré:</strong> {profileFields.find(f => f.key === 'favoriteF1Driver')?.options?.find(o => o.value === profileData.favoriteF1Driver)?.label}</div>
              )}
              {profileData.preferredSports.length > 0 && (
                <div><strong>🏆 Sports préférés:</strong> {profileData.preferredSports.map((sport: string) => 
                  profileFields.find(f => f.key === 'preferredSports')?.options?.find(o => o.value === sport)?.label
                ).join(', ')}</div>
              )}
              {profileData.watchingHabits && (
                <div><strong>📺 Habitudes:</strong> {profileFields.find(f => f.key === 'watchingHabits')?.options?.find(o => o.value === profileData.watchingHabits)?.label}</div>
              )}
              {profileData.languages.length > 0 && (
                <div><strong>🗣️ Langues:</strong> {profileData.languages.map((lang: string) => 
                  profileFields.find(f => f.key === 'languages')?.options?.find(o => o.value === lang)?.label
                ).join(', ')}</div>
              )}
              {profileData.profileImage && (
                <div className="mt-4">
                  <strong>📸 Photo de profil:</strong> <span className="text-green-600">✓ Ajoutée</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 space-y-3 sm:space-y-0 flex-shrink-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            💡 Utilisez l'icône 👁️ pour contrôler la visibilité de chaque information
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}