import React, { useState, useEffect } from 'react';
import { X, Copy, Clock, CheckCircle, AlertCircle, Share2, Sparkles } from 'lucide-react';
import { ClaimedDeal, getClaimTimeRemaining } from '../lib/dealClaimHelpers';

interface ClaimCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimedDeal: ClaimedDeal | null;
}

export const ClaimCodeModal: React.FC<ClaimCodeModalProps> = ({
  isOpen,
  onClose,
  claimedDeal
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && claimedDeal) {
      updateTimeRemaining();
      
      // Update time remaining every minute
      const interval = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen, claimedDeal]);

  const updateTimeRemaining = () => {
    if (claimedDeal) {
      setTimeRemaining(getClaimTimeRemaining(claimedDeal.expires_at));
    }
  };

  const handleCopyCode = async () => {
    if (!claimedDeal) return;
    
    try {
      await navigator.clipboard.writeText(claimedDeal.claim_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleShare = async () => {
    if (!claimedDeal) return;
    
    const shareData = {
      title: 'InstantFork Deal Claimed',
      text: `I claimed a deal! Code: ${claimedDeal.claim_code}`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} - ${shareData.url}`
        );
        alert('Deal details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (!isOpen || !claimedDeal) return null;

  const isExpired = claimedDeal.status === 'expired' || timeRemaining === 'Expired';
  const isRedeemed = claimedDeal.status === 'redeemed';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <Sparkles className="w-5 h-5 text-rose-500 mr-2" />
            Deal Claimed!
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Deal Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {claimedDeal.deal_title || 'Deal Claimed'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {claimedDeal.restaurant_name || 'Restaurant'}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold text-rose-500">
                ${claimedDeal.deal_price?.toFixed(2) || '0.00'}
              </span>
              <span className="text-lg text-gray-500 line-through">
                ${claimedDeal.original_price?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center space-x-2">
            {isRedeemed ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Redeemed
                </span>
              </>
            ) : isExpired ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Expired
                </span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {timeRemaining}
                </span>
              </>
            )}
          </div>

          {/* Claim Code Display */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 text-center">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Your Claim Code
            </h4>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-dashed border-rose-300 dark:border-rose-700">
              <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-wider font-mono">
                {claimedDeal.claim_code}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className={`mt-4 flex items-center justify-center space-x-2 w-full py-2 px-4 rounded-lg transition-all ${
                copied 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to redeem at the restaurant:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Tell the staff: "I have an InstantFork deal"</li>
              <li>2. Give them your claim code: <span className="font-mono font-bold">{claimedDeal.claim_code}</span></li>
              <li>3. They'll enter it in their system to verify</li>
              <li>4. Enjoy your discounted meal!</li>
            </ol>
          </div>

          {/* Claim Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Claim Code:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {claimedDeal.claim_code}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Claimed:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {new Date(claimedDeal.claimed_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Expires:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {new Date(claimedDeal.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isExpired && !isRedeemed && (
            <div className="flex space-x-3">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};