'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface AudioContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  playAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if audio was previously muted/volume set in localStorage (optional)
    const storedMute = localStorage.getItem('ton_empires_audio_muted');
    const storedVolume = localStorage.getItem('ton_empires_audio_volume');
    
    if (storedMute !== null) setIsMuted(storedMute === 'true');
    if (storedVolume !== null) setVolume(parseFloat(storedVolume));
  }, []);

  useEffect(() => {
    localStorage.setItem('ton_empires_audio_muted', isMuted.toString());
    localStorage.setItem('ton_empires_audio_volume', volume.toString());
    
    if (audioRef.current) {
      audioRef.current.volume = volume;
      // Pre-set volume before play attempt
      if (!isMuted && hasInteracted && audioRef.current.paused) {
        audioRef.current.play().catch(() => {
          // Silent catch for initial blocked autoplay
        });
      } else if (isMuted) {
        audioRef.current.pause();
      }
    }
  }, [volume, isMuted, hasInteracted]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Play immediately on first interaction
        if (audioRef.current && !isMuted) {
          audioRef.current.play().then(() => {
            console.log("Audio started successfully on interaction");
          }).catch((err) => {
            console.warn("Audio play still failing on interaction:", err);
          });
        }
      }
    };

    // More aggressive interaction detection
    const events = ['click', 'touchstart', 'mousedown', 'keydown', 'pointerdown'];
    events.forEach(event => window.addEventListener(event, handleFirstInteraction));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleFirstInteraction));
    };
  }, [isMuted, hasInteracted]);

  const playAudio = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <AudioContext.Provider value={{ isMuted, setIsMuted, volume, setVolume, playAudio }}>
      <audio
        ref={audioRef}
        src="/background.mp3"
        loop
        preload="auto"
        autoPlay={!isMuted}
      />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
