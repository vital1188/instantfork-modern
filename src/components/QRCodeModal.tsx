import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ClaimedDeal, generateQRCode, getClaimTimeRemaining } from '../lib/dealClaimHelpers';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimedDeal: ClaimedDeal | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  claimedDeal
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && claimedDeal) {
      generateQRCodeImage();
      updateTimeRemaining();
      
      // Update time remaining every minute
      const interval = setInterval(updateTimeRemaining, 60000);
      return () => clearInterval(interval);
    }
  }, [isOpen, claimedDeal]);

  const generateQRCodeImage = async () => {
    if (!claimedDeal) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const qrUrl = await generateQRCode(claimedDeal.qr_data);
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTimeRemaining = () => {
    if (claimedDeal) {
      setTimeRemaining(getClaimTimeRemaining(claimedDeal.expires_at));
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl || !claimedDeal) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `instantfork-deal-${claimedDeal.claim_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!claimedDeal) return;
    
    const shareData = {
      title: 'InstantFork Deal Claimed',
      text: `I claimed a deal: ${claimedDeal.qr_data.deal_title} at ${claimedDeal.qr_data.restaurant_name}`,
      url: window.location.origin
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
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
              {claimedDeal.qr_data.deal_title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {claimedDeal.qr_data.restaurant_name}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold text-rose-500">
                ${claimedDeal.qr_data.deal_price.toFixed(2)}
              </span>
              <span className="text-lg text-gray-500 line-through">
                ${claimedDeal.qr_data.original_price.toFixed(2)}
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

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              {isGenerating ? (
                <div className="w-64 h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                </div>
              ) : error ? (
                <div className="w-64 h-64 flex items-center justify-center text-red-500">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">{error}</p>
                    <button
                      onClick={generateQRCodeImage}
                      className="mt-2 text-rose-500 hover:text-rose-600 text-sm underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Deal QR Code"
                  className="w-64 h-64 object-contain"
                />
              ) : null}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              How to use this deal:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Show this QR code to the restaurant staff</li>
              <li>2. They will scan it to verify your deal</li>
              <li>3. Enjoy your discounted meal!</li>
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
          {!isExpired && !isRedeemed && qrCodeUrl && (
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
