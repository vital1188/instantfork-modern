import React, { useState, useRef, useEffect } from 'react';
import { QrCode, CheckCircle, AlertCircle, X, Camera, Type, RefreshCw } from 'lucide-react';
import { redeemDeal, parseQRCodeData, QRCodeData } from '../lib/dealClaimHelpers';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
}

interface ScanResult {
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

export const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  restaurantId
}) => {
  const [inputMethod, setInputMethod] = useState<'camera' | 'manual'>('manual');
  const [qrInput, setQrInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera when switching to camera mode
  useEffect(() => {
    if (inputMethod === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [inputMethod, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraActive(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setIsCameraActive(true);
          startScanning();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions or use manual input.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    setIsCameraActive(false);
  };

  const startScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 500); // Scan every 500ms
  };

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Try to use ZXing library for QR code detection
      const { BrowserQRCodeReader } = await import('@zxing/library');
      const codeReader = new BrowserQRCodeReader();
      
      // Create an image element from canvas
      const dataUrl = canvas.toDataURL();
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await codeReader.decodeFromImage(img);
          if (result) {
            setQrInput(result.getText());
            stopCamera();
            setInputMethod('manual');
            // Auto-process the scanned QR code
            await processQRCode(result.getText());
          }
        } catch {
          // QR code not found - continue scanning
        }
      };
      img.src = dataUrl;
    } catch {
      // QR code not found or error in scanning - this is normal, continue scanning
    }
  };

  const processQRCode = async (qrData: string) => {
    if (!qrData.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Parse QR code data
      const parsedData: QRCodeData = parseQRCodeData(qrData);
      
      // Redeem the deal
      const redeemResult = await redeemDeal(parsedData.claim_code, restaurantId);
      
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
        setQrInput('');
      } else {
        setResult({
          success: false,
          message: redeemResult.error || 'Failed to redeem deal'
        });
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid QR code'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCodeEntry = async () => {
    if (!qrInput.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Try to redeem directly with the code
      const redeemResult = await redeemDeal(qrInput.trim().toUpperCase(), restaurantId);
      
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
        setQrInput('');
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
    setQrInput('');
    setCameraError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Scan Deal QR Code
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
              {/* Input Method Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setInputMethod('camera')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    inputMethod === 'camera'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Camera</span>
                </button>
                <button
                  onClick={() => setInputMethod('manual')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    inputMethod === 'manual'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Manual</span>
                </button>
              </div>

              {inputMethod === 'camera' ? (
                <div className="space-y-4">
                  {/* Camera View */}
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    {cameraError ? (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                          <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                            {cameraError}
                          </p>
                          <button
                            onClick={startCamera}
                            className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors mx-auto"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Retry Camera</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        
                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white rounded-lg relative">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-rose-500 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-rose-500 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-rose-500 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-rose-500 rounded-br-lg"></div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="absolute top-4 left-4 right-4">
                          <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm text-center">
                            {isCameraActive ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Scanning for QR codes...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Starting camera...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Camera Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                      Camera Instructions:
                    </h4>
                    <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Point camera at customer's QR code</li>
                      <li>• Keep QR code within the scanning frame</li>
                      <li>• Hold steady for automatic detection</li>
                      <li>• Ensure good lighting for best results</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Manual Input */}
                  <div className="text-center">
                    <QrCode className="w-12 sm:w-16 h-12 sm:h-16 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Enter Deal Code
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Paste QR code data or enter the claim code manually
                    </p>
                  </div>

                  {/* Input Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      QR Code Data or Claim Code
                    </label>
                    <textarea
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      placeholder="Paste QR code data here or enter 8-character claim code (e.g., ABC12345)"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 resize-none text-sm"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => processQRCode(qrInput)}
                      disabled={!qrInput.trim() || isProcessing}
                      className="w-full btn-primary py-2 sm:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing QR Code...</span>
                        </div>
                      ) : (
                        'Process QR Code'
                      )}
                    </button>

                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                      or
                    </div>

                    <button
                      onClick={handleManualCodeEntry}
                      disabled={!qrInput.trim() || isProcessing || qrInput.length !== 8}
                      className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2 sm:py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span>Redeeming...</span>
                        </div>
                      ) : (
                        'Redeem with Code'
                      )}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm">
                      How to use:
                    </h4>
                    <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>1. Ask customer to show their deal QR code</li>
                      <li>2. Copy and paste the QR code data above</li>
                      <li>3. Or manually enter the 8-character claim code</li>
                      <li>4. Click "Process" to redeem the deal</li>
                    </ol>
                  </div>
                </div>
              )}
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
                  Scan Another
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
