// frontend/src/pages/JoinViaLink.jsx - COMPLETE FILE
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link2, Users, CheckCircle, XCircle, Loader } from 'lucide-react';
import { joinViaLink } from '../services/groupService';
import { AuthContext } from '../context/AuthContext';

export default function JoinViaLink() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation('conversation');
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);

  useEffect(() => {
    console.log('🔗 [JoinViaLink] Effect triggered:', { 
      code, 
      hasUser: !!user, 
      loading, 
      success, 
      error 
    });

    // 🔥 PRIORITY 1: Check for pending invite code after login
    const pendingCode = sessionStorage.getItem('pendingInviteCode');
    
    if (pendingCode && user && !loading && !success && !error) {
      console.log('🔗 [JoinViaLink] Found pending code after login:', pendingCode);
      
      // Clear pending code immediately
      sessionStorage.removeItem('pendingInviteCode');
      
      // Auto-join with pending code
      handleJoin();
      return;
    }
    
    // 🔥 PRIORITY 2: Auto-join if user is already logged in
    if (user && code && !loading && !success && !error) {
      console.log('🔗 [JoinViaLink] User already logged in, auto-joining:', code);
      handleJoin();
    }
  }, [user, code]);

  const handleJoin = async () => {
    if (!user) {
      console.log('🔗 [JoinViaLink] No user, saving code and redirecting to login');
      
      // 🔥 Save code to sessionStorage before redirecting to login
      sessionStorage.setItem('pendingInviteCode', code);
      
      console.log('💾 [JoinViaLink] Saved pendingInviteCode:', code);
      
      // Redirect to login with return URL
      navigate(`/login?redirect=/join/${code}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔗 [JoinViaLink] Calling joinViaLink API:', code);
      const result = await joinViaLink(code);
      
      console.log('✅ [JoinViaLink] Join successful:', result);
      setGroupInfo(result.conversation);
      setSuccess(true);

      // 🔥 Redirect to conversation immediately after short delay (500ms)
      setTimeout(() => {
        console.log('🏠 [JoinViaLink] Redirecting to conversation');
        
        // Import chatStore để set active conversation
        const useChatStore = window.useChatStore;
        if (useChatStore) {
          // Add conversation to store if not exists
          const addConversation = useChatStore.getState().addConversation;
          const setActiveConversation = useChatStore.getState().setActiveConversation;
          
          addConversation(result.conversation);
          setActiveConversation(result.conversation._id);
          
          console.log('✅ [JoinViaLink] Set active conversation:', result.conversation._id);
        }
        
        // Navigate to home (conversation will auto-open from store)
        navigate('/');
      }, 500);
    } catch (err) {
      console.error('❌ [JoinViaLink] Join failed:', err);
      
      const errorMessage = err.response?.data?.message || err.message;
      
      // Handle specific error cases
      if (errorMessage.includes('LINK_NOT_FOUND')) {
        setError(t('inviteLinks.errors.notFound'));
      } else if (errorMessage.includes('LINK_EXPIRED')) {
        setError(t('inviteLinks.errors.expired'));
      } else if (errorMessage.includes('LINK_INACTIVE')) {
        setError(t('inviteLinks.errors.inactive'));
      } else if (errorMessage.includes('MAX_USES_REACHED')) {
        setError(t('inviteLinks.errors.maxUses'));
      } else if (errorMessage.includes('ALREADY_MEMBER')) {
        setError(t('inviteLinks.errors.alreadyMember'));
        
        // 🔥 Still redirect to conversation after 1 second
        setTimeout(() => {
          const useChatStore = window.useChatStore;
          if (useChatStore) {
            const setActiveConversation = useChatStore.getState().setActiveConversation;
            // Find conversation by searching in store
            const conversations = useChatStore.getState().conversations;
            const foundConversation = Array.from(conversations.values()).find(
              conv => conv._id === err.response?.data?.conversationId
            );
            
            if (foundConversation) {
              setActiveConversation(foundConversation._id);
            }
          }
          navigate('/');
        }, 1000);
      } else {
        setError(errorMessage || t('inviteLinks.errors.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            success ? 'bg-green-100' : error ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {loading ? (
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            ) : success ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : error ? (
              <XCircle className="w-10 h-10 text-red-600" />
            ) : (
              <Link2 className="w-10 h-10 text-blue-600" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          {loading && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('inviteLinks.joining')}
              </h2>
              <p className="text-gray-600">
                {t('inviteLinks.joiningMessage')}
              </p>
            </>
          )}

          {success && (
            <>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                {t('inviteLinks.success')}
              </h2>
              <p className="text-gray-600 mb-4">
                {t('inviteLinks.successMessage')}
              </p>
              {groupInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center gap-3">
                    {groupInfo.avatar ? (
                      <img 
                        src={groupInfo.avatar} 
                        alt={groupInfo.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{groupInfo.name}</p>
                      <p className="text-sm text-gray-600">
                        {groupInfo.totalMembers} {t('inviteLinks.members')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                {t('inviteLinks.redirecting')}
              </p>
            </>
          )}

          {error && (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                {t('inviteLinks.error')}
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('inviteLinks.goHome')}
                </button>
                {!user && (
                  <button
                    onClick={() => navigate(`/login?redirect=/join/${code}`)}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('inviteLinks.login')}
                  </button>
                )}
              </div>
            </>
          )}

          {!loading && !success && !error && !user && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('inviteLinks.loginRequired')}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('inviteLinks.loginMessage')}
              </p>
              <button
                onClick={() => navigate(`/login?redirect=/join/${code}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('inviteLinks.loginButton')}
              </button>
            </>
          )}
        </div>

        {/* Code Display */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">
            {t('inviteLinks.inviteCode')}
          </p>
          <code className="block text-center text-sm bg-gray-100 px-4 py-2 rounded font-mono">
            {code}
          </code>
        </div>
      </div>
    </div>
  );
}