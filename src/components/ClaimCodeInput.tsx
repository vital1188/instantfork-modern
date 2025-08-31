import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Hash, RefreshCw, Search } from 'lucide-react';
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
    if (!claimCode.trim() || claimCode.length !== 8) return;

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
    if (e.key === 'Enter' && claimCode.trim().length === 8 && !isProcessing) {
      handleRedeemCode();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setClaimCode(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <Hash className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Redeem Deal Code
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter customer's 8-character code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Customer's Claim Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={claimCode}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="ABC12345"
                      maxLength={8}
                      className="w-full px-4 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:bg-gray-800 dark:text-gray-100 text-center text-2xl font-mono tracking-widest uppercase placeholder-gray-400"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Ask customer: "What's your InstantFork code?"
                  </p>
                </div>

                {/* Code Length Indicator */}
                <div className="flex justify-center space-x-1">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-1 rounded-full transition-colors ${
                        index < claimCode.length 
                          ? 'bg-rose-500' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRedeemCode}
                disabled={claimCode.length !== 8 || isProcessing}
                className="w-full flex items-center justify-center space-x-2 py-4 px-6 bg-rose-500 text-white rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Redeem Deal</span>
                  </>
                )}
              </button>

              {/* Quick Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                  Quick Steps:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Ask: "What's your InstantFork code?"</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Type the 8-character code above</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Click "Redeem Deal" to complete</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              {result.success ? (
                <>
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                      Deal Redeemed Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      The customer's deal has been verified and redeemed.
                    </p>
                  </div>
                  
                  {result.dealInfo && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left space-y-2">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-3 text-sm">
                        Deal Details:
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Deal:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 text-right max-w-[60%]">
                            {result.dealInfo.deal_title}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Restaurant:</span>
                          <span className="font-medium text-green-900 dark:text-green-100">
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
                          <span className="text-green-700 dark:text-green-300">Original:</span>
                          <span className="font-medium text-green-900 dark:text-green-100 line-through">
                            ${result.dealInfo.original_price.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Savings:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">
                            ${(result.dealInfo.original_price - result.dealInfo.deal_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      Redemption Failed
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {result.message}
                    </p>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Another</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
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