// frontend/src/components/Chat/ConversationInfo/InviteLinkModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Link2, Copy, Check, Trash2, Clock, Users, Plus, Eye, EyeOff } from 'lucide-react';
import { 
  createInviteLink, 
  getInviteLinks, 
  deactivateInviteLink 
} from '../../../services/groupService';

export default function InviteLinkModal({ 
  show, 
  onClose, 
  conversationId,
  isOwner 
}) {
  const { t } = useTranslation('conversation');
  
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create form state
  const [expiresIn, setExpiresIn] = useState('');
  const [maxUses, setMaxUses] = useState('');

  // Fetch links when modal opens
  useEffect(() => {
    if (show && conversationId) {
      fetchLinks();
    }
  }, [show, conversationId]);

  const fetchLinks = async () => {
    if (!isOwner) return; // Only owner can view all links
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInviteLinks(conversationId);
      setLinks(data.links || []);
    } catch (err) {
      console.error('Failed to fetch invite links:', err);
      setError(err.response?.data?.message || 'Failed to load invite links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const options = {};
      if (expiresIn) options.expiresIn = parseInt(expiresIn);
      if (maxUses) options.maxUses = parseInt(maxUses);
      
      const newLink = await createInviteLink(conversationId, options);
      
      // Add to list
      setLinks([newLink, ...links]);
      
      // Reset form
      setExpiresIn('');
      setMaxUses('');
      setShowCreateForm(false);
      
      // Auto-copy new link
      handleCopyLink(newLink);
    } catch (err) {
      console.error('Failed to create invite link:', err);
      setError(err.response?.data?.message || 'Failed to create invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (linkId) => {
    setLoading(true);
    setError(null);
    
    try {
      await deactivateInviteLink(conversationId, linkId);
      
      // Update list
      setLinks(links.map(link => 
        link._id === linkId 
          ? { ...link, isActive: false }
          : link
      ));
    } catch (err) {
      console.error('Failed to deactivate link:', err);
      setError(err.response?.data?.message || 'Failed to deactivate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link._id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('inviteLinks.title')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('inviteLinks.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Create Link Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={loading}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-gray-600 hover:text-green-600 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{t('inviteLinks.createNew')}</span>
            </button>
          )}

          {/* Create Form */}
          {showCreateForm && (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{t('inviteLinks.createNew')}</h4>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inviteLinks.expiresIn')}
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('inviteLinks.noExpiry')}</option>
                    <option value="3600">{t('inviteLinks.1hour')}</option>
                    <option value="86400">{t('inviteLinks.1day')}</option>
                    <option value="604800">{t('inviteLinks.7days')}</option>
                    <option value="2592000">{t('inviteLinks.30days')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('inviteLinks.maxUses')}
                  </label>
                  <select
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">{t('inviteLinks.unlimited')}</option>
                    <option value="1">1 {t('inviteLinks.use')}</option>
                    <option value="5">5 {t('inviteLinks.uses')}</option>
                    <option value="10">10 {t('inviteLinks.uses')}</option>
                    <option value="25">25 {t('inviteLinks.uses')}</option>
                    <option value="100">100 {t('inviteLinks.uses')}</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('inviteLinks.creating')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('inviteLinks.create')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Links List */}
          {loading && links.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{t('inviteLinks.noLinks')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link._id}
                  className={`border rounded-lg p-4 transition-all ${
                    link.isActive
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {link.isActive ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        link.isActive ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {link.isActive ? t('inviteLinks.active') : t('inviteLinks.inactive')}
                      </span>
                    </div>
                    
                    {link.isActive && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyLink(link)}
                          className="p-1.5 hover:bg-green-100 rounded text-green-600 transition-colors"
                          title={t('inviteLinks.copy')}
                        >
                          {copiedLinkId === link._id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeactivate(link._id)}
                          disabled={loading}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors disabled:opacity-50"
                          title={t('inviteLinks.deactivate')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Link URL */}
                  <div className="mb-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border border-gray-300 block truncate">
                      {link.url}
                    </code>
                  </div>

                  {/* Link Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    {link.createdBy && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {link.createdBy.nickname}
                      </span>
                    )}
                    {link.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(link.expiresAt)}
                      </span>
                    )}
                    {link.maxUses && (
                      <span>
                        {link.usedCount}/{link.maxUses} {t('inviteLinks.uses')}
                      </span>
                    )}
                    {!link.maxUses && (
                      <span>
                        {link.usedCount} {t('inviteLinks.uses')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            {t('inviteLinks.info')}
          </p>
        </div>
      </div>
    </div>
  );
}