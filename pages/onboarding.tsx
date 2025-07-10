// pages/onboarding.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  User, Mail, MapPin, Heart, Trophy, Star, 
  ChevronRight, ChevronLeft, Check, Sparkles,
  Globe, Calendar, Briefcase, Users, Camera,
  ArrowRight, Flag, Target, Zap, Loader
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const OnboardingPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Étape 1 - Basics
    name: '',
    username: '',
    bio: '',
    age: '',
    location: '',
    
    // Étape 2 - Sports Preferences
    favoriteSports: [],
    favoriteTeams: {
      football: '',
      basketball: '',
      tennis: '',
      f1: ''
    },
    watchingStyle: '',
    
    // Étape 3 - Personalization
    avatar: null,
    theme: 'light',
    visibility: {
      location: true,
      age: false,
      teams: true
    },
    
    // Étape 4 - Goals
    goals: [],
    expectations: ''
  });

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return; // Attendre le chargement
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Pré-remplir avec les données existantes de l'utilisateur
    if (session.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        // On pourrait récupérer plus de données via une API call
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
    { id: 'basics', title: 'Qui êtes-vous ?', desc: 'Parlez-nous de vous' },
    { id: 'sports', title: 'Vos sports', desc: 'Quels sports vous passionnent ?' },
    { id: 'personalization', title: 'Personnalisation', desc: 'Créez votre style' },
    { id: 'goals', title: 'Vos objectifs', desc: 'Que voulez-vous accomplir ?' }
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
      // Essayer de sauvegarder via l'API profile/enhanced s'il existe
      try {
        await axios.put('/api/profile/enhanced', {
          name: formData.name,
          username: formData.username,
          bio: formData.bio,
          age: formData.age,
          location: formData.location,
          favoriteClub: formData.favoriteTeams.football,
          favoriteBasketballTeam: formData.favoriteTeams.basketball,
          favoriteTennisPlayer: formData.favoriteTeams.tennis,
          favoriteF1Driver: formData.favoriteTeams.f1,
          preferredSports: formData.favoriteSports,
          watchingHabits: formData.watchingStyle,
          languages: [], 
          visibility: formData.visibility
        });
      } catch (enhancedError) {
        console.log('API enhanced pas disponible, utilisation API de base');
        // Fallback vers l'API de base
        await axios.put('/api/profile', {
          name: formData.name || undefined,
          username: formData.username || undefined,
          bio: formData.bio || undefined
        });
      }

      // Sauvegarder l'avatar si sélectionné
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
      
      // Rediriger vers l'app principale
      router.push('/?welcome=true');
      
    } catch (error) {
      console.error('Erreur sauvegarde onboarding:', error);
      toast.error('Erreur lors de la sauvegarde. Vos données seront sauvegardées plus tard.');
      
      // Même en cas d'erreur, rediriger vers l'app
      router.push('/?welcome=true');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('Configuration ignorée par l\'utilisateur');
    
    // Sauvegarder le minimum si quelque chose a été rempli
    if (formData.name.trim() || formData.username.trim()) {
      try {
        await axios.put('/api/profile', {
          name: formData.name || undefined,
          username: formData.username || undefined,
          bio: formData.bio || undefined
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

  const canProceed = () => {
    return true; // Toujours possible de continuer
  };

  const isStepComplete = () => {
    switch(currentStep) {
      case 0:
        return formData.name.trim() && formData.username.trim();
      case 1:
        return formData.favoriteSports.length > 0;
      case 2:
        return formData.avatar;
      case 3:
        return formData.goals.length > 0;
      default:
        return false;
    }
  };

  // Afficher un loader pendant l'authentification
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
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenue sur Sporating ! 🎉</h2>
              <p className="text-gray-600 text-lg mb-4">Commençons par faire connaissance</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Configuration optionnelle</strong> - Vous pouvez passer ces étapes et personnaliser votre profil plus tard !
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Comment vous appelez-vous ? ✨
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Choisissez un nom d'utilisateur unique 🎯
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500 text-lg">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                    className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="votre_pseudo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Votre âge 🎂
                  </label>
                  <select
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({...prev, age: e.target.value}))}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
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
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="Votre ville"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Décrivez-vous en quelques mots 💬
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                  rows={3}
                  placeholder="Fan de sport passionné, j'adore analyser les matchs et partager mes opinions..."
                  maxLength={150}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.bio.length}/150 caractères
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vos passions sportives 🏆</h2>
              <p className="text-gray-600 text-lg">Dites-nous quels sports vous font vibrer</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sélectionnez vos sports préférés :</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${
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

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quel type de spectateur êtes-vous ? 🎭</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchingStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setFormData(prev => ({...prev, watchingStyle: style.id}))}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
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

            {formData.favoriteSports.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Vos équipes favorites 💙</h3>
                <div className="space-y-4">
                  {formData.favoriteSports.map((sportId) => {
                    const sport = sports.find(s => s.id === sportId);
                    return (
                      <div key={sportId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {sport.name}
                        </label>
                        <input
                          type="text"
                          value={formData.favoriteTeams[sportId] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            favoriteTeams: {
                              ...prev.favoriteTeams,
                              [sportId]: e.target.value
                            }
                          }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={
                            sportId === 'football' ? 'ex: PSG, Real Madrid...' :
                            sportId === 'basketball' ? 'ex: Lakers, Warriors...' :
                            sportId === 'tennis' ? 'ex: Djokovic, Serena...' :
                            sportId === 'f1' ? 'ex: Lewis Hamilton, Max Verstappen...' :
                            'Votre équipe/joueur favori'
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Personnalisez votre profil ✨</h2>
              <p className="text-gray-600 text-lg">Faites-le vôtre avec style</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Choisissez votre avatar 🎨</h3>
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
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-800 text-sm">
                    💡 Vous pourrez uploader votre propre photo plus tard dans les paramètres !
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Paramètres de confidentialité 🔒</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Afficher mes équipes favorites</p>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Vos objectifs sur Sporating 🎯</h2>
              <p className="text-gray-600 text-lg">Que voulez-vous accomplir avec nous ?</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Sélectionnez vos objectifs :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
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
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
                rows={4}
                placeholder="Partagez vos attentes, vos espoirs, ou ce qui vous motive à rejoindre notre communauté..."
                maxLength={300}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.expectations.length}/300 caractères
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Configuration du profil</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Étape {currentStep + 1} sur {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                disabled={loading}
              >
                Ignorer la configuration
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0 || loading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 0 || loading
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSkipStep}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
              >
                Passer cette étape
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transform hover:scale-105 flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isStepComplete() ? 'Continuer' : 'Continuer quand même'}</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
                  >
                    Terminer plus tard
                  </button>
                  
                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white hover:shadow-lg transform hover:scale-105 flex items-center space-x-2 px-8 py-4 rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Créer mon profil</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Steps Preview */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index === currentStep ? 'text-blue-600' : 
                  index < currentStep ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index === currentStep ? 'bg-blue-100 text-blue-600' :
                  index < currentStep ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <span className="hidden md:block text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Tips */}
        {currentStep === 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">💡 Conseils pour votre profil</h3>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Utilisez votre vrai nom pour que vos amis vous trouvent facilement</li>
                  <li>• Choisissez un nom d'utilisateur unique et mémorable</li>
                  <li>• Une bio sympa attire plus d'interactions dans la communauté</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">🔥 Pourquoi c'est important ?</h3>
                <ul className="text-orange-800 text-sm space-y-1">
                  <li>• Nous personnaliserons vos recommandations de matchs</li>
                  <li>• Vous recevrez des notifications pour vos équipes favorites</li>
                  <li>• Connectez-vous avec des fans qui partagent vos passions</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">✨ Exprimez votre personnalité</h3>
                <ul className="text-purple-800 text-sm space-y-1">
                  <li>• Votre avatar sera visible sur tous vos commentaires</li>
                  <li>• Vous pouvez modifier ces paramètres à tout moment</li>
                  <li>• La confidentialité est importante pour nous</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">🎯 Nous adaptons l'expérience</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Interface personnalisée selon vos objectifs</li>
                  <li>• Suggestions de fonctionnalités prioritaires</li>
                  <li>• Parcours d'apprentissage sur mesure</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Card */}
      {currentStep >= 0 && formData.name && (
        <div className="fixed bottom-6 right-6 max-w-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                formData.avatar ? 
                avatarPresets.find(a => a.id === formData.avatar)?.color || 'bg-gray-300' : 
                'bg-gray-300'
              }`}>
                {formData.avatar ? 
                  avatarPresets.find(a => a.id === formData.avatar)?.emoji || '👤' : 
                  '👤'
                }
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{formData.name || 'Votre nom'}</h4>
                <p className="text-sm text-gray-500">@{formData.username || 'username'}</p>
              </div>
            </div>
            {formData.bio && (
              <p className="text-sm text-gray-600 mb-3">{formData.bio}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.favoriteSports.map(sportId => {
                const sport = sports.find(s => s.id === sportId);
                return (
                  <span key={sportId} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {sport?.name.split(' ')[1]} {sport?.name.split(' ')[0]}
                  </span>
                );
              })}
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-blue-600 font-medium">👀 Aperçu de votre profil</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;