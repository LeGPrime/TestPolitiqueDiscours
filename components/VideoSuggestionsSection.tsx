// components/VideoSuggestionsSection.tsx - VERSION SIMPLIFIÉE
import React, { useState } from 'react';
import { Youtube, Plus, ThumbsUp, ThumbsDown, ExternalLink, Play, Users, Clock, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

interface VideoSuggestion {
  id: string;
  matchId: string;
  url: string;
  title: string;
  description?: string;
  platform: 'youtube' | 'dailymotion' | 'twitch' | 'other';
  suggestedBy: {
    id: string;
    name: string;
    username: string;
    image?: string;
  };
  votes: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
  };
  createdAt: string;
  isVerified?: boolean;
  reportsCount?: number;
}

interface VideoSuggestionsSectionProps {
  matchId: string;
  matchTitle: string;
  currentUserId?: string;
  suggestions: VideoSuggestion[];
  onRefresh: () => void;
}

const VideoSuggestionsSection: React.FC<VideoSuggestionsSectionProps> = ({
  matchId,
  matchTitle,
  currentUserId,
  suggestions,
  onRefresh
}) => {
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({
    url: '',
    title: '',
    description: ''
  });

  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: '🔴',
      dailymotion: '🔵', 
      twitch: '🟣',
      other: '📺'
    };
    return icons[platform as keyof typeof icons] || icons.other;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Il y a moins d\'1h';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)} jour(s)`;
  };

  const handleVote = async (suggestionId: string, voteType: 'up' | 'down') => {
    if (!currentUserId) {
      alert('Connectez-vous pour voter');
      return;
    }

    try {
      const response = await axios.post('/api/video-votes', {
        suggestionId,
        voteType
      });

      if (response.data.success) {
        onRefresh();
      }
    } catch (error) {
      console.error('Erreur vote:', error);
      alert('Erreur lors du vote');
    }
  };

  const handleSuggest = async () => {
    if (!currentUserId) {
      alert('Connectez-vous pour suggérer une vidéo');
      return;
    }

    if (!newSuggestion.url.trim()) {
      alert('Veuillez entrer une URL');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/video-suggestions/${matchId}`, {
        url: newSuggestion.url.trim(),
        title: newSuggestion.title.trim() || undefined,
        description: newSuggestion.description.trim() || undefined
      });

      if (response.data.success) {
        setNewSuggestion({ url: '', title: '', description: '' });
        setShowSuggestForm(false);
        onRefresh();
        alert('✅ Suggestion ajoutée ! Merci pour votre contribution 🎉');
      }
    } catch (error: any) {
      console.error('Erreur suggestion:', error);
      const message = error.response?.data?.error || 'Erreur lors de la suggestion';
      alert(`❌ ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (suggestionId: string) => {
    if (!currentUserId) {
      alert('Connectez-vous pour signaler');
      return;
    }

    const reason = prompt('Raison du signalement:\n- Spam\n- Inapproprié\n- Lien cassé\n- Doublon\n- Autre');
    if (!reason) return;

    try {
      await axios.post('/api/video-reports', {
        suggestionId,
        reason: reason.toLowerCase(),
        comment: ''
      });

      alert('✅ Signalement envoyé');
      onRefresh();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erreur lors du signalement';
      alert(`❌ ${message}`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 🎯 SECTION PRINCIPALE - Cards directement visibles */}
      {suggestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 text-center">
          <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            📺 Aucun résumé vidéo pour l'instant
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Les meilleures vidéos suggérées par la communauté apparaîtront ici
          </p>
          {currentUserId && (
            <button
              onClick={() => setShowSuggestForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ✨ Suggérer la première vidéo
            </button>
          )}
        </div>
      ) : (
        // 🎯 LISTE DES SUGGESTIONS - Cards élégantes
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={suggestion.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow">
              
              {/* Header de la suggestion */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Badge position */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Titre avec plateforme */}
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                          {suggestion.title}
                        </h3>
                        <span className="text-lg flex-shrink-0">{getPlatformIcon(suggestion.platform)}</span>
                        {suggestion.isVerified && (
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                            ✅ Vérifié
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {suggestion.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {suggestion.description}
                        </p>
                      )}

                      {/* Meta informations */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>Par {suggestion.suggestedBy.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(suggestion.createdAt)}</span>
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Score: +{suggestion.votes.upvotes - suggestion.votes.downvotes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                
                {/* Votes */}
                <div className="flex items-center space-x-3">
                  {currentUserId ? (
                    <>
                      <button
                        onClick={() => handleVote(suggestion.id, 'up')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          suggestion.votes.userVote === 'up' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : 'bg-white dark:bg-slate-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-500'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{suggestion.votes.upvotes}</span>
                      </button>

                      <button
                        onClick={() => handleVote(suggestion.id, 'down')}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          suggestion.votes.userVote === 'down' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                            : 'bg-white dark:bg-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-500'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{suggestion.votes.downvotes}</span>
                      </button>

                      <button 
                        onClick={() => handleReport(suggestion.id)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                        title="Signaler"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{suggestion.votes.upvotes}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <ThumbsDown className="w-4 h-4" />
                        <span>{suggestion.votes.downvotes}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bouton voir */}
                <a
                  href={suggestion.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Regarder</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎯 BOUTON SUGGÉRER - Toujours visible si connecté */}
      {currentUserId && suggestions.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowSuggestForm(!showSuggestForm)}
            className={`inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${
              showSuggestForm 
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showSuggestForm ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Annuler la suggestion</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Suggérer une autre vidéo</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 🎯 FORMULAIRE DE SUGGESTION - Se déplie naturellement */}
      {showSuggestForm && currentUserId && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <span>✨ Suggérer une vidéo</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔗 Lien de la vidéo *
              </label>
              <input
                type="url"
                value={newSuggestion.url}
                onChange={(e) => setNewSuggestion(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Plateformes supportées : YouTube, Dailymotion, Twitch
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 Titre (optionnel)
              </label>
              <input
                type="text"
                value={newSuggestion.title}
                onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Résumé complet avec tous les buts"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                💭 Description (optionnel)
              </label>
              <textarea
                value={newSuggestion.description}
                onChange={(e) => setNewSuggestion(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Pourquoi recommandez-vous cette vidéo ?"
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none transition-all"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowSuggestForm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSuggest}
                disabled={!newSuggestion.url.trim() || submitting}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed font-medium"
              >
                {submitting ? '⏳ Envoi...' : '✨ Suggérer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSuggestionsSection;