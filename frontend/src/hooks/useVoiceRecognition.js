import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const permissionCheckRef = useRef(false);

  // Check browser support and permissions on mount
  useEffect(() => {
    const checkSupport = () => {
      const SpeechRecognition = 
        window.SpeechRecognition || 
        window.webkitSpeechRecognition || 
        window.mozSpeechRecognition || 
        window.msSpeechRecognition;
      
      setIsSupported(!!SpeechRecognition);
      return !!SpeechRecognition;
    };

    const checkPermissions = async () => {
      if (permissionCheckRef.current) return;
      permissionCheckRef.current = true;

      try {
        if (navigator.permissions && navigator.permissions.query) {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          setPermissionStatus(permission.state);
          setHasPermission(permission.state === 'granted');
          
          permission.onchange = () => {
            setPermissionStatus(permission.state);
            setHasPermission(permission.state === 'granted');
          };
        }
      } catch (err) {
        console.log('Permission API not supported:', err);
        setPermissionStatus('prompt');
      }
    };

    if (checkSupport()) {
      checkPermissions();
    }
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream, we just needed permission
      setHasPermission(true);
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setHasPermission(false);
      setPermissionStatus('denied');
      setError('Microphone access is required for voice commands. Please enable microphone permissions in your browser settings.');
      return false;
    }
  }, []);

  // Initialize speech recognition
  const initializeRecognition = useCallback((isWakeWord = false) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge for voice commands.');
      return null;
    }

    const SpeechRecognition = 
      window.SpeechRecognition || 
      window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    
    recognition.continuous = isWakeWord; // Continuous listening for wake word
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English for better rupee recognition
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      if (isWakeWord) {
        setIsWakeWordListening(true);
      } else {
        setIsListening(true);
      }
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interim += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        setConfidence(maxConfidence);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      const errorMessages = {
        'not-allowed': 'Microphone access denied. Please enable microphone permissions and try again.',
        'no-speech': 'No speech detected. Please try speaking again.',
        'audio-capture': 'No microphone found. Please connect a microphone and try again.',
        'network': 'Network error occurred. Please check your internet connection.',
        'aborted': 'Speech recognition was stopped.',
        'language-not-supported': 'Language not supported. Please use English.',
      };

      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
      
      if (isWakeWord) {
        setIsWakeWordListening(false);
      } else {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isWakeWord) {
        setIsWakeWordListening(false);
        // Restart wake word listening if it was intentional
        setTimeout(() => {
          if (wakeWordRecognitionRef.current) {
            try {
              wakeWordRecognitionRef.current.start();
            } catch (err) {
              console.log('Wake word recognition restart failed:', err);
            }
          }
        }, 1000);
      } else {
        setIsListening(false);
      }
    };

    return recognition;
  }, [isSupported]);

  // Start wake word detection
  const startWakeWordListening = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
      }

      const recognition = initializeRecognition(true);
      if (recognition) {
        wakeWordRecognitionRef.current = recognition;
        recognition.start();
        return true;
      }
    } catch (err) {
      console.error('Failed to start wake word listening:', err);
      setError('Failed to start wake word detection. Please try again.');
    }
    return false;
  }, [hasPermission, requestPermission, initializeRecognition]);

  // Stop wake word detection
  const stopWakeWordListening = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.stop();
      wakeWordRecognitionRef.current = null;
    }
    setIsWakeWordListening(false);
  }, []);

  // Start manual voice recognition
  const startListening = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = initializeRecognition(false);
      if (recognition) {
        recognitionRef.current = recognition;
        setTranscript('');
        setInterimTranscript('');
        recognition.start();
        return true;
      }
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError('Failed to start voice recognition. Please try again.');
    }
    return false;
  }, [hasPermission, requestPermission, initializeRecognition]);

  // Stop manual voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
      }
    };
  }, []);

  return {
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
  };
};

export default useVoiceRecognition;
