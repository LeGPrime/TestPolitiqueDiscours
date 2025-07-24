// components/CommunityVideoSystem.tsx - VERSION SIMPLE ET PROPRE
import React, { useState } from 'react';
import { Youtube, Plus, ThumbsUp, ThumbsDown, ExternalLink, Play, Users, Clock, Flag, X } from 'lucide-react';
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

interface CommunityVideoSystemProps {
  matchId: string;
  matchTitle: string;
  currentUserId?: string;
  suggestions: VideoSuggestion[];
  onRefresh: () => void;
}

const CommunityVideoSystem: React.FC<CommunityVideoSystemProps> = ({
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center space-x-2">
              <Youtube className="w-5 h-5" />
              <span>📺 Résumés Vidéo</span>
            </h3>
            <p className="text-red-100 text-sm mt-1">
              {suggestions.length > 0 
                ? `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} de la communauté` 
                : 'Aucune suggestion pour l\'instant'
              }
            </p>
          </div>
          
          {currentUserId && (
            <button
              onClick={() => setShowSuggestForm(!showSuggestForm)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                showSuggestForm 
                  ? 'bg-white/30 text-white' 
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {showSuggestForm ? (
                <>
                  <X className="w-4 h-4 inline mr-1" />
                  Annuler
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 inline mr-1" />
                  Suggérer
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Formulaire de suggestion */}
      {showSuggestForm && currentUserId && (
        <div className="p-4 bg-blue-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📝 Titre (optionnel)
              </label>
              <input
                type="text"
                value={newSuggestion.title}
                onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Résumé complet du match"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
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
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none text-sm"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSuggestForm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium border border-gray-300 dark:border-slate-500"
              >
                Annuler
              </button>
              <button
                onClick={handleSuggest}
                disabled={!newSuggestion.url.trim() || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium"
              >
                {submitting ? '⏳ Envoi...' : '✨ Suggérer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des suggestions */}
      <div className="max-h-96 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="p-6 text-center">
            <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              Aucune suggestion vidéo pour ce match
            </p>
            {currentUserId && (
              <button
                onClick={() => setShowSuggestForm(true)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm"
              >
                Soyez le premier à en suggérer une ! 🎬
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {suggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                
                {/* Header suggestion */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Badge position */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Titre et plateforme */}
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {suggestion.title}
                        </h4>
                        <span className="text-sm flex-shrink-0">{getPlatformIcon(suggestion.platform)}</span>
                        {suggestion.isVerified && (
                          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                            ✅
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {suggestion.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{suggestion.suggestedBy.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(suggestion.createdAt)}</span>
                        </span>
                        <span className="font-medium">
                          +{suggestion.votes.upvotes - suggestion.votes.downvotes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton voir */}
                  <a
                    href={suggestion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 ml-3 inline-flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    <span>Voir</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Actions votes */}
                {currentUserId && (
                  <div className="flex items-center justify-between pl-9">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(suggestion.id, 'up')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          suggestion.votes.userVote === 'up' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{suggestion.votes.upvotes}</span>
                      </button>

                      <button
                        onClick={() => handleVote(suggestion.id, 'down')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                          suggestion.votes.userVote === 'down' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{suggestion.votes.downvotes}</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => handleReport(suggestion.id)}
                      className="flex items-center space-x-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-xs text-gray-500 dark:text-gray-400 transition-colors"
                      title="Signaler"
                    >
                      <Flag className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityVideoSystem;