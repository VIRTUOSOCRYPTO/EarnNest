import React, { useState, useEffect, useCallback } from 'react';
import useVoiceRecognition from '../hooks/useVoiceRecognition';
import { parseVoiceCommand, containsWakeWord, getCommandSuggestions } from '../utils/voiceCommandParser';
import { 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';

const VoiceCommand = ({ 
  onVoiceCommand, 
  onTransactionData, 
  disabled = false,
  className = ""
}) => {
  const {
    isListening,
    isWakeWordListening,
    transcript,
    interimTranscript,
    confidence,
    isSupported,
    hasPermission,
    permissionStatus,
    error,
    startListening,
    stopListening,
    startWakeWordListening,
    stopWakeWordListening,
    requestPermission,
    resetTranscript
  } = useVoiceRecognition();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [voiceResults, setVoiceResults] = useState(null);
  const [processingCommand, setProcessingCommand] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');

  // Process voice commands when transcript changes
  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript && transcript.trim().length > 0) {
      setLastProcessedTranscript(transcript);
      processVoiceCommand(transcript);
    }
  }, [transcript, lastProcessedTranscript]);

  // Process voice command and extract transaction data
  const processVoiceCommand = useCallback(async (voiceTranscript) => {
    if (!voiceTranscript || processingCommand) return;
    
    setProcessingCommand(true);
    
    try {
      const result = parseVoiceCommand(voiceTranscript);
      setVoiceResults(result);
      
      if (result.success) {
        // If it's a wake word command, automatically process it
        if (result.isWakeWordCommand) {
          onTransactionData?.(result.data);
          onVoiceCommand?.(result.data);
          
          // Stop listening after successful wake word command
          if (isListening) {
            stopListening();
          }
        } else {
          // For manual voice commands, let the user confirm
          onVoiceCommand?.(result);
        }
      } else {
        // Show error or partial results
        onVoiceCommand?.(result);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setVoiceResults({ 
        success: false, 
        error: 'Failed to process voice command. Please try again.' 
      });
    } finally {
      setProcessingCommand(false);
    }
  }, [processingCommand, onTransactionData, onVoiceCommand, isListening, stopListening]);

  // Handle microphone button click
  const handleMicClick = useCallback(async () => {
    if (!isSupported) {
      setShowVoiceHelp(true);
      return;
    }

    if (!hasPermission && permissionStatus !== 'granted') {
      setShowPermissionDialog(true);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setVoiceResults(null);
      const started = await startListening();
      if (!started) {
        setShowPermissionDialog(true);
      }
    }
  }, [isSupported, hasPermission, permissionStatus, isListening, stopListening, startListening, resetTranscript]);

  // Handle wake word toggle
  const handleWakeWordToggle = useCallback(async () => {
    if (!isSupported) {
      setShowVoiceHelp(true);
      return;
    }

    if (!hasPermission && permissionStatus !== 'granted') {
      setShowPermissionDialog(true);
      return;
    }

    if (isWakeWordListening) {
      stopWakeWordListening();
    } else {
      const started = await startWakeWordListening();
      if (!started) {
        setShowPermissionDialog(true);
      }
    }
  }, [isSupported, hasPermission, permissionStatus, isWakeWordListening, startWakeWordListening, stopWakeWordListening]);

  // Handle permission request
  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    setShowPermissionDialog(false);
    
    if (granted) {
      // Auto-start wake word listening after permission is granted
      startWakeWordListening();
    }
  };

  // Get microphone button style based on state
  const getMicButtonStyle = () => {
    if (disabled) return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (isListening) return 'bg-red-500 text-white animate-pulse shadow-lg';
    if (hasPermission) return 'bg-blue-500 text-white hover:bg-blue-600';
    return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
  };

  // Render browser support warning
  if (!isSupported) {
    return (
      <div className={`voice-command-container ${className}`}>
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            Voice commands require Chrome, Safari, or Edge browser
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowVoiceHelp(true)}
              className="ml-2 p-1 h-auto text-yellow-600 hover:text-yellow-800"
            >
              <InformationCircleIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-command-container ${className}`}>
      {/* Main Voice Controls */}
      <div className="flex items-center space-x-3">
        {/* Manual Microphone Button */}
        <div className="relative">
          <Button
            onClick={handleMicClick}
            disabled={disabled}
            className={`relative p-3 rounded-full transition-all duration-200 ${getMicButtonStyle()}`}
            title={isListening ? 'Stop listening' : 'Start voice command'}
          >
            <MicrophoneIcon className="w-5 h-5" />
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
            )}
          </Button>
        </div>

        {/* Wake Word Toggle */}
        <div className="relative">
          <Button
            onClick={handleWakeWordToggle}
            disabled={disabled}
            variant={isWakeWordListening ? "default" : "outline"}
            className={`text-sm transition-all duration-200 ${
              isWakeWordListening 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'hover:bg-green-50 hover:border-green-300 hover:text-green-700'
            }`}
            title={isWakeWordListening ? 'Wake word listening active' : 'Enable "Hey EarnNest" commands'}
          >
            <SpeakerWaveIcon className="w-4 h-4 mr-2" />
            Hey EarnNest
            {isWakeWordListening && (
              <span className="ml-2 w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            )}
          </Button>
        </div>

        {/* Voice Help Button */}
        <Button
          onClick={() => setShowVoiceHelp(true)}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          title="Voice command help"
        >
          <InformationCircleIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Voice Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm text-blue-800 font-medium mb-1">
                Voice Input:
              </div>
              <div className="text-blue-900">
                {transcript}
                {interimTranscript && (
                  <span className="text-blue-600 italic"> {interimTranscript}</span>
                )}
              </div>
              {confidence > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
            <Button
              onClick={resetTranscript}
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-blue-600 hover:text-blue-800"
            >
              <XMarkIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Results Display */}
      {voiceResults && (
        <div className={`mt-3 p-3 rounded-lg border ${
          voiceResults.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start space-x-2">
            {voiceResults.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {voiceResults.success ? (
                <div>
                  <div className="text-sm font-medium text-green-800 mb-2">
                    Voice Command Recognized:
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div><strong>Type:</strong> {voiceResults.data.type}</div>
                    <div><strong>Amount:</strong> ₹{voiceResults.data.amount}</div>
                    <div><strong>Category:</strong> {voiceResults.data.category}</div>
                    <div><strong>Description:</strong> {voiceResults.data.description}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-red-800 mb-1">
                    Could not process command:
                  </div>
                  <div className="text-sm text-red-700">
                    {voiceResults.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MicrophoneIcon className="w-8 h-8 text-blue-600" />
              <h3 className="text-lg font-semibold">Microphone Permission Required</h3>
            </div>
            <p className="text-gray-600 mb-4">
              EarnNest needs microphone access to recognize your voice commands like 
              "Hey EarnNest, I earned ₹500 from tutoring". This enables hands-free expense and income logging.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="text-sm text-blue-800">
                <strong>Privacy:</strong> Your voice is processed locally in your browser. 
                No audio data is stored or transmitted to our servers.
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={handlePermissionRequest} className="flex-1">
                Enable Microphone
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPermissionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Help Modal */}
      {showVoiceHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <SpeakerWaveIcon className="w-6 h-6 mr-2 text-blue-600" />
                Voice Commands Help
              </h3>
              <Button
                onClick={() => setShowVoiceHelp(false)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">How to Use Voice Commands:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-semibold text-xs">1</span>
                    </div>
                    <div>
                      <strong>Manual Mode:</strong> Click the microphone button and speak your command
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-semibold text-xs">2</span>
                    </div>
                    <div>
                      <strong>Wake Word Mode:</strong> Enable "Hey EarnNest" for hands-free commands
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Example Commands:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-green-700 mb-2">💰 Income Commands:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {getCommandSuggestions('income').map((suggestion, index) => (
                        <div key={index} className="bg-green-50 p-2 rounded text-green-800">
                          "{suggestion}"
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-red-700 mb-2">💳 Expense Commands:</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {getCommandSuggestions('expense').map((suggestion, index) => (
                        <div key={index} className="bg-red-50 p-2 rounded text-red-800">
                          "{suggestion}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tips for Better Recognition:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Speak clearly and at normal pace</li>
                  <li>• Use "rupees" or "₹" when mentioning amounts</li>
                  <li>• Include category context (e.g., "food", "transport", "tutoring")</li>
                  <li>• Try to minimize background noise</li>
                  <li>• You can say amounts as "five hundred rupees" or "500 rupees"</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Browser Support:</h4>
                <div className="text-sm text-gray-600">
                  Voice commands work best in Chrome, Safari, and Edge browsers. 
                  Make sure to allow microphone permissions when prompted.
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button onClick={() => setShowVoiceHelp(false)} className="w-full">
                Got it, Thanks!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommand;
