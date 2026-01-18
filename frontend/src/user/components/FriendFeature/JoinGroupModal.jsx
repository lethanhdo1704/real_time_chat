// frontend/src/user/components/FriendFeature/JoinGroupModal.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Link2, Hash, CheckCircle, XCircle, Loader } from 'lucide-react';
import { joinViaLink } from '../../services/groupService';
import useChatStore from '../../store/chat/chatStore';

export default function JoinGroupModal({ show, onClose }) {
  const { t } = useTranslation('friendFeature');
  const navigate = useNavigate();
  
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!show) return null;

  // Extract code from input (handles both code and full URL)
  const extractCode = (input) => {
    const trimmed = input.trim();
    
    // Case 1: Full URL like "http://localhost:5173/join/ABC123"
    if (trimmed.includes('/join/')) {
      const parts = trimmed.split('/join/');
      return parts[1]?.split(/[?#]/)[0] || trimmed; // Get code, ignore query params
    }
    
    // Case 2: Just the code like "ABC123"
    return trimmed;
  };

  const handleJoin = async () => {
    if (!inputValue.trim()) {
      setError(t('joinGroup.errors.emptyInput'));
      return;
    }

    const code = extractCode(inputValue);
    
    if (!code) {
      setError(t('joinGroup.errors.invalidFormat'));
      return;
    }

    console.log('🔗 [JoinGroupModal] Joining with code:', code);

    setLoading(true);
    setError(null);

    try {
      const result = await joinViaLink(code);
      
      console.log('✅ [JoinGroupModal] Join successful:', result);
      
      // Add to store
      const { addConversation, setActiveConversation } = useChatStore.getState();
      addConversation(result.conversation);
      setActiveConversation(result.conversation._id);
      
      setSuccess(true);
      
      // Close modal and navigate after short delay
      setTimeout(() => {
        onClose();
        navigate(`/groups/${result.conversation._id}`);
      }, 1000);
    } catch (err) {
      console.error('❌ [JoinGroupModal] Join failed:', err);
      
      const errorMessage = err.response?.data?.message || err.message;
      
      // Handle specific errors
      if (errorMessage.includes('LINK_NOT_FOUND')) {
        setError(t('joinGroup.errors.notFound'));
      } else if (errorMessage.includes('LINK_EXPIRED')) {
        setError(t('joinGroup.errors.expired'));
      } else if (errorMessage.includes('LINK_INACTIVE')) {
        setError(t('joinGroup.errors.inactive'));
      } else if (errorMessage.includes('MAX_USES_REACHED')) {
        setError(t('joinGroup.errors.maxUses'));
      } else if (errorMessage.includes('ALREADY_MEMBER')) {
        setError(t('joinGroup.errors.alreadyMember'));
        
        // Still navigate to conversation
        setTimeout(() => {
          onClose();
          navigate('/groups');
        }, 2000);
      } else {
        setError(errorMessage || t('joinGroup.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setError(null); // Clear error on input
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin();
    }
  };

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('joinGroup.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('joinGroup.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Success State */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  {t('joinGroup.success.title')}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {t('joinGroup.success.message')}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">
                  {t('joinGroup.error')}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('joinGroup.inputLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={loading || success}
                placeholder={t('joinGroup.placeholder')}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {loading ? (
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Hash className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('joinGroup.hint')}
            </p>
          </div>

          {/* Examples */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">
              {t('joinGroup.examples.title')}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <code className="bg-white px-2 py-0.5 rounded">ABC123DEF</code>
              </p>
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <code className="bg-white px-2 py-0.5 rounded text-xs">
                  {window.location.origin}/join/ABC123DEF
                </code>
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('joinGroup.cancel')}
            </button>
            <button
              onClick={handleJoin}
              disabled={loading || success || !inputValue.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{t('joinGroup.joining')}</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>{t('joinGroup.join')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}