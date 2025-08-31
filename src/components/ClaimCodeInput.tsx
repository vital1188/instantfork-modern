import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Hash, RefreshCw } from 'lucide-react';
import { redeemDeal } from '../lib/dealClaimHelpers';

interface ClaimCodeInputProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
}

interface RedeemResult {
  success: boolean;
  message: string;
  dealInfo?: {
    deal_title: string;
    restaurant_name: string;
    deal_price: number;
    original_price: number;
    redeemed_at: string;
  };
}

export const ClaimCodeInput: React.FC<ClaimCodeInputProps> = ({
  isOpen,
  onClose,
  restaurantId
}) => {
  const [claimCode, setClaimCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  const handleRedeemCode = async () => {
    if (!claimCode.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const redeemResult = await redeemDeal(claimCode.trim().toUpperCase(), restaurantId);
      
      if (redeemResult.success) {
        setResult({
          success: true,
          message: 'Deal redeemed successfully!',
          dealInfo: {
            deal_title: redeemResult.deal_title || '',
            restaurant_name: redeemResult.restaurant_name || '',
            deal_price: redeemResult.deal_price || 0,
            original_price: redeemResult.original_price || 0,
            redeemed_at: redeemResult.redeemed_at || new Date().toISOString()
          }
        });
        setClaimCode('');
      } else {
        setResult({
          success: false,
          message: redeemResult.error || 'Failed to redeem deal'
        });
      }
    } catch (error) {
      console.error('Error redeeming deal:', error);
      setResult({
        success: false,
        message: 'Failed to redeem deal'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setClaimCode('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && claimCode.trim() && !isProcessing) {
      handleRedeemCode();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Redeem Deal Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {!result ? (
            <>
              {/* Instructions */}
              <div className="text-center">
                <Hash className="w-12 sm:w-16 h-12 sm:h-16 text-rose-500 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Enter Customer's Deal Code
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ask the customer for their 8-character claim code
                </p>
              </div>

              {/* Input Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Claim Code
                </label>
                <input
                  type="text"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC12345"
                  maxLength={8}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 text-center text-lg font-mono tracking-wider uppercase"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the 8-character code (e.g., ABC12345)
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRedeemCode}
                disabled={!claimCode.trim() || claimCode.length !== 8 || isProcessing}
                className="w-full btn-primary py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Redeeming Deal...</span>
                  </div>
                ) : (
                  'Redeem Deal'
                )}
              </button>

              {/* Quick Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                  Quick Steps:
                </h4>
                <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Ask customer: "What's your InstantFork code?"</li>
                  <li>2. Enter the 8-character code above</li>
                  <li>3. Click "Redeem Deal" to verify and complete</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              {result.success ? (
                <>
                  <CheckCircle className="w-12 sm:w-16 h-12 sm:h-16 text-green-500 mx-auto" />
                  <h3 className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                    Deal Redeemed Successfully!
                  </h3>
                  
                  {result.dealInfo && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 text-sm">
                        Deal Details:
                      </h4>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between items-start">
                          <span className="text-green-700 dark:text-green-300">Deal:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 text-right ml-2">
                            {result.dealInfo.deal_title}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-green-700 dark:text-green-300">Restaurant:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 text-right ml-2">
                            {result.dealInfo.restaurant_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Deal Price:</span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            ${result.dealInfo.deal_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Original Price:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 line-through">
                            ${result.dealInfo.original_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-green-700 dark:text-green-300">Redeemed:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 text-right ml-2">
                            {new Date(result.dealInfo.redeemed_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 sm:w-16 h-12 sm:h-16 text-red-500 mx-auto" />
                  <h3 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                    Redemption Failed
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      {result.message}
                    </p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 sm:py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Try Another Code
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 btn-primary py-2 sm:py-3 text-sm sm:text-base"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};