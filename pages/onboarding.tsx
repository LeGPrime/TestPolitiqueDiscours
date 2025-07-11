// pages/onboarding.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  User, Mail, MapPin, Heart, Trophy, Star, 
  ChevronRight, ChevronLeft, Check, Sparkles,
  Globe, Calendar, Briefcase, Users, Camera,
  ArrowRight, Flag, Target, Zap, Loader, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const OnboardingPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Étape 1 - Inscription complète
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Étape 2 - Username
    username: '',
    
    // Étape 3 - Âge et Localisation
    age: '',
    location: '',
    
    // Étape 4 - Sports Preferences
    favoriteSports: [],
    
    // Étape 5 - Style de visionnage
    watchingStyle: '',
    
    // Étape 6 - Avatar
    avatar: null,
    
    // Étape 7 - Confidentialité
    visibility: {
      location: true,
      age: false,
      teams: true
    },
    
    // Étape 8 - Goals
    goals: [],
    expectations: ''
  });

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Pré-remplir avec les données existantes de l'utilisateur
    if (session.user) {
      const name = session.user.name || '';
      const nameParts = name.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: session.user.email || ''
      }));
    }
  }, [session, status, router]);

  const sports = [
    { id: 'football', name: 'Football ⚽', color: 'from-green-400 to-emerald-600' },
    { id: 'basketball', name: 'Basketball 🏀', color: 'from-orange-400 to-red-500' },
    { id: 'tennis', name: 'Tennis 🎾', color: 'from-yellow-400 to-orange-500' },
    { id: 'f1', name: 'Formule 1 🏎️', color: 'from-red-400 to-pink-600' },
    { id: 'rugby', name: 'Rugby 🏉', color: 'from-green-400 to-green-600' },
    { id: 'mma', name: 'MMA 🥊', color: 'from-red-500 to-red-700' }
  ];

  const watchingStyles = [
    { id: 'casual', name: 'Spectateur Occasionnel', desc: 'Je regarde de temps en temps', emoji: '😊' },
    { id: 'passionate', name: 'Fan Passionné', desc: 'Je ne rate jamais un match important', emoji: '🔥' },
    { id: 'analyst', name: 'Analyste', desc: 'J\'adore décortiquer les tactiques', emoji: '🧠' },
    { id: 'social', name: 'Social Viewer', desc: 'Je préfère regarder avec des amis', emoji: '👥' }
  ];

  const avatarPresets = [
    { id: 'sport_1', emoji: '⚽', color: 'bg-green-500' },
    { id: 'sport_2', emoji: '🏀', color: 'bg-orange-500' },
    { id: 'sport_3', emoji: '🏆', color: 'bg-yellow-500' },
    { id: 'sport_4', emoji: '⭐', color: 'bg-blue-500' },
    { id: 'sport_5', emoji: '🎯', color: 'bg-purple-500' },
    { id: 'sport_6', emoji: '🔥', color: 'bg-red-500' }
  ];

  const userGoals = [
    { id: 'discover', name: 'Découvrir de nouveaux sports', emoji: '🌟' },
    { id: 'track', name: 'Suivre mes matchs préférés', emoji: '📊' },
    { id: 'friends', name: 'Connecter avec d\'autres fans', emoji: '👥' },
    { id: 'expert', name: 'Devenir un expert critique', emoji: '🎯' },
    { id: 'stats', name: 'Analyser mes statistiques', emoji: '📈' },
    { id: 'collections', name: 'Créer des collections de matchs', emoji: '📚' }
  ];

  const steps = [
    { id: 'signup', title: 'Inscription', desc: 'Créez votre compte' },
    { id: 'username', title: 'Nom d\'utilisateur', desc: 'Choisissez votre pseudo' },
    { id: 'location-age', title: 'Informations', desc: 'Âge et localisation' },
    { id: 'sports', title: 'Sports préférés', desc: 'Vos passions' },
    { id: 'watching', title: 'Style de visionnage', desc: 'Comment regardez-vous ?' },
    { id: 'avatar', title: 'Avatar', desc: 'Personnalisez votre profil' },
    { id: 'privacy', title: 'Confidentialité', desc: 'Vos paramètres' },
    { id: 'goals', title: 'Objectifs', desc: 'Vos attentes' }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSport = (sportId) => {
    setFormData(prev => ({
      ...prev,
      favoriteSports: prev.favoriteSports.includes(sportId)
        ? prev.favoriteSports.filter(s => s !== sportId)
        : [...prev.favoriteSports, sportId]
    }));
  };

  const toggleGoal = (goalId) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      try {
        await axios.put('/api/profile/enhanced', {
          name: fullName,
          username: formData.username,
          age: formData.age,
          location: formData.location,
          preferredSports: formData.favoriteSports,
          watchingHabits: formData.watchingStyle,
          languages: [], 
          visibility: formData.visibility
        });
      } catch (enhancedError) {
        console.log('API enhanced pas disponible, utilisation API de base');
        await axios.put('/api/profile', {
          name: fullName || undefined,
          username: formData.username || undefined
        });
      }

      if (formData.avatar) {
        try {
          await axios.post('/api/profile/avatar', {
            imageData: formData.avatar
          });
        } catch (avatarError) {
          console.log('API avatar pas disponible');
        }
      }

      toast.success('🎉 Profil configuré avec succès ! Bienvenue dans la communauté Sporating !');
      router.push('/?welcome=true');
      
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
      toast.error('Erreur lors de la sauvegarde. Vos données seront sauvegardées plus tard.');
      router.push('/?welcome=true');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('Configuration ignorée par l\'utilisateur');
    
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (fullName || formData.username.trim()) {
      try {
        await axios.put('/api/profile', {
          name: fullName || undefined,
          username: formData.username || undefined
        });
      } catch (error) {
        console.log('Erreur sauvegarde partielle:', error);
      }
    }
    
    toast.success('👋 Pas de problème ! Vous pourrez personnaliser votre profil plus tard dans les paramètres.');
    router.push('/?fromOnboarding=skipped');
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const isStepComplete = () => {
    switch(currentStep) {
      case 0:
        return formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      case 1:
        return formData.username.trim();
      case 2:
        return formData.age && formData.location.trim();
      case 3:
        return formData.favoriteSports.length > 0;
      case 4:
        return formData.watchingStyle;
      case 5:
        return formData.avatar;
      case 6:
        return true;
      case 7:
        return formData.goals.length > 0;
      default:
        return false;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch(currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Créer un compte</h2>
              <p className="text-gray-600 text-sm mb-6">Rejoignez Sporating en quelques secondes</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Prénom ✨
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nom ✨
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email 📧
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mot de passe 🔑
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                    className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Confirmer le mot de passe 🔐
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                    className="w-full px-3 py-2.5 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Confirmez votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue sur Sporating ! 🎉</h2>
              <p className="text-gray-600 text-lg mb-8">Comment vous appelez-vous ?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nom d'utilisateur unique 🎯
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 text-lg">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                    className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="votre_pseudo"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Informations personnelles 📍</h2>
              <p className="text-gray-600 text-lg mb-8">Parlez-nous de vous</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Votre âge 🎂
                  </label>
                  <select
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="13-17">13-17 ans</option>
                    <option value="18-24">18-24 ans</option>
                    <option value="25-34">25-34 ans</option>
                    <option value="35-44">35-44 ans</option>
                    <option value="45-54">45-54 ans</option>
                    <option value="55+">55+ ans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    D'où venez-vous ? 🌍
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="Votre ville"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vos passions sportives 🏆</h2>
              <p className="text-gray-600 text-lg mb-8">Quels sports vous font vibrer ?</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sélectionnez vos sports préférés :</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                      formData.favoriteSports.includes(sport.id)
                        ? `bg-gradient-to-r ${sport.color} text-white border-transparent shadow-lg transform scale-105`
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{sport.name.split(' ')[1]}</div>
                    <div className="font-semibold">{sport.name.split(' ')[0]}</div>
                    {formData.favoriteSports.includes(sport.id) && (
                      <Check className="w-5 h-5 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Votre style de visionnage 🎭</h2>
              <p className="text-gray-600 text-lg mb-8">Comment regardez-vous le sport ?</p>
            </div>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchingStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFormData(prev => ({...prev, watchingStyle: style.id}))}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.watchingStyle === style.id
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{style.emoji}</span>
                      <h4 className="font-semibold text-gray-900">{style.name}</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choisissez votre avatar ✨</h2>
              <p className="text-gray-600 text-lg mb-8">Personnalisez votre profil</p>
            </div>

            <div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {avatarPresets.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setFormData(prev => ({...prev, avatar: avatar.id}))}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
                      formData.avatar === avatar.id
                        ? `${avatar.color} shadow-lg transform scale-110 ring-4 ring-blue-500`
                        : `${avatar.color} hover:shadow-md hover:scale-105`
                    }`}
                  >
                    {avatar.emoji}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 text-sm">
                    💡 Vous pourrez uploader votre propre photo plus tard dans les paramètres !
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Paramètres de confidentialité 🔒</h2>
              <p className="text-gray-600 text-lg mb-8">Contrôlez votre visibilité</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Afficher ma localisation</p>
                    <p className="text-sm text-gray-600">Visible sur votre profil public</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    visibility: {...prev.visibility, location: !prev.visibility.location}
                  }))}
                  className={`w-12 h-6 rounded-full transition-all duration-200 ${
                    formData.visibility.location ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    formData.visibility.location ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Afficher mon âge</p>
                    <p className="text-sm text-gray-600">Visible sur votre profil public</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    visibility: {...prev.visibility, age: !prev.visibility.age}
                  }))}
                  className={`w-12 h-6 rounded-full transition-all duration-200 ${
                    formData.visibility.age ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    formData.visibility.age ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Afficher mes sports favoris</p>
                    <p className="text-sm text-gray-600">Visible sur votre profil public</p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    visibility: {...prev.visibility, teams: !prev.visibility.teams}
                  }))}
                  className={`w-12 h-6 rounded-full transition-all duration-200 ${
                    formData.visibility.teams ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    formData.visibility.teams ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vos objectifs sur Sporating 🎯</h2>
              <p className="text-gray-600 text-lg mb-8">Que voulez-vous accomplir avec nous ?</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sélectionnez vos objectifs :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                      formData.goals.includes(goal.id)
                        ? 'bg-gradient-to-r from-green-400 to-teal-500 text-white border-transparent shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{goal.emoji}</span>
                      <p className="font-semibold">{goal.name}</p>
                      {formData.goals.includes(goal.id) && (
                        <Check className="w-5 h-5 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Qu'attendez-vous de Sporating ? 💭</h3>
              <textarea
                value={formData.expectations}
                onChange={(e) => setFormData(prev => ({...prev, expectations: e.target.value}))}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                rows={4}
                placeholder="Partagez vos attentes, vos espoirs, ou ce qui vous motive à rejoindre notre communauté..."
                maxLength={300}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.expectations.length}/300 caractères
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Vous y êtes presque ! 🚀</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Une fois votre profil créé, vous pourrez :
                    • Noter vos premiers matchs • Découvrir des recommandations personnalisées 
                    • Rejoindre des discussions passionnantes • Créer vos propres listes de matchs favoris
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 safe-area-inset">
      {/* Header plus compact et plus bas */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 pt-safe">
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-semibold text-gray-900">Configuration du profil</h1>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-600">
                Étape {currentStep + 1} sur {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                disabled={loading}
              >
                Ignorer
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation plus compacte en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0 || loading}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                currentStep === 0 || loading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSkipStep}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-xl hover:bg-gray-100 text-xs font-medium disabled:opacity-50"
              >
                Passer cette étape
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-md flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isStepComplete() ? 'Continuer' : 'Continuer quand même'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-md flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Créer mon profil</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Steps Preview plus discret */}
          <div className="flex items-center justify-center space-x-1.5 mt-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  index === currentStep ? 'bg-blue-600 w-6' : 
                  index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;