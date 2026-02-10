'use client';

import { useState, useEffect } from 'react';

export type AudioCapabilities = {
  speechRecognitionSupported: boolean;
  speechSynthesisSupported: boolean;
  mediaRecorderSupported: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isNative: boolean;
  preferredMimeType: string;
};

function getPreferredMimeType(): string {
  if (typeof window === 'undefined') return 'audio/webm';
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return 'audio/webm';
}

export function useAudioCapabilities(): AudioCapabilities {
  const [cap, setCap] = useState<AudioCapabilities>({
    speechRecognitionSupported: false,
    speechSynthesisSupported: false,
    mediaRecorderSupported: false,
    isIOS: false,
    isAndroid: false,
    isNative: false,
    preferredMimeType: 'audio/webm',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const cap = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
    const isNative = !!cap.Capacitor?.isNativePlatform?.();

    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    const speechRecognitionSupported = !!SR;
    const speechSynthesisSupported = !!window.speechSynthesis;
    const mediaRecorderSupported = typeof MediaRecorder !== 'undefined';
    const preferredMimeType = getPreferredMimeType();

    setCap({
      speechRecognitionSupported,
      speechSynthesisSupported,
      mediaRecorderSupported,
      isIOS,
      isAndroid,
      isNative,
      preferredMimeType,
    });
  }, []);

  return cap;
}
