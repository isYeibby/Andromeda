import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * usePlayer — Manages Spotify Web Playback SDK lifecycle
 */
export function usePlayer() {
  const { getValidToken } = useAuthStore();
  const playerRef = useRef(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      const token = await getValidToken();
      if (!token || !window.Spotify) return;

      const player = new window.Spotify.Player({
        name: 'ANDROMEDA // Neural Interface',
        getOAuthToken: async (cb) => {
          const t = await getValidToken();
          cb(t);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        if (!mounted) return;
        console.log('[PLAYER] Ready with Device ID:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      player.addListener('not_ready', ({ device_id }) => {
        if (!mounted) return;
        console.log('[PLAYER] Device offline:', device_id);
        setIsReady(false);
      });

      player.addListener('player_state_changed', (state) => {
        if (!mounted || !state) return;

        const track = state.track_window.current_track;
        setCurrentTrack(track ? {
          id: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url || '',
          uri: track.uri,
        } : null);

        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error('[PLAYER] Init error:', message);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('[PLAYER] Auth error:', message);
      });

      player.addListener('account_error', ({ message }) => {
        console.error('[PLAYER] Account error (Premium required):', message);
      });

      player.addListener('playback_error', ({ message }) => {
        console.error('[PLAYER] Playback error:', message);
      });

      const success = await player.connect();
      if (success) {
        console.log('[PLAYER] Connected to Spotify');
        playerRef.current = player;
      }
    };

    // Wait for SDK to load
    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [getValidToken]);

  // Position tracking interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isPlaying && playerRef.current) {
      intervalRef.current = setInterval(async () => {
        const state = await playerRef.current.getCurrentState();
        if (state) setPosition(state.position);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    if (playerRef.current) await playerRef.current.togglePlay();
  }, []);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.nextTrack();
  }, []);

  const prevTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.previousTrack();
  }, []);

  const seekTo = useCallback(async (ms) => {
    if (playerRef.current) {
      await playerRef.current.seek(ms);
      setPosition(ms);
    }
  }, []);

  const setVolume = useCallback(async (val) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(val);
      setVolumeState(val);
    }
  }, []);

  return {
    player: playerRef.current,
    deviceId,
    isReady,
    isPlaying,
    currentTrack,
    position,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
  };
}
