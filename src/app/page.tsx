"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Music, Pause, SkipForward, SkipBack, Loader2, X } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const [playingTrack, setPlayingTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const desktopProgressBarRef = useRef<HTMLDivElement | null>(null);
  const mobileProgressBarRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length === 0) return;

    setSearchedQuery(query);
    setIsSearched(true);
    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Failed to search", error);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Function to clear the search and return to the main screen
  const handleReset = () => {
    setQuery("");
    setSearchedQuery("");
    setIsSearched(false);
    setResults([]);
    // Note: We purposely do NOT stop the music here. 
    // It feels cooler if the music keeps playing while they search for something else!
  };

  const handlePlayTrack = (track: any) => {
    if (playingTrack?.id === track.id) {
      togglePlayPause();
    } else {
      setPlayingTrack(track);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!playingTrack) return;
    const currentIndex = results.findIndex(t => t.id === playingTrack.id);
    if (currentIndex < results.length - 1) {
      handlePlayTrack(results[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!playingTrack) return;
    const currentIndex = results.findIndex(t => t.id === playingTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(results[currentIndex - 1]);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>, isMobile: boolean) => {
    if (!audioRef.current || !duration) return;

    const barRef = isMobile ? mobileProgressBarRef : desktopProgressBarRef;
    if (!barRef.current) return;

    const rect = barRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));

    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    if (audioRef.current && playingTrack) {
      audioRef.current.src = playingTrack.audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [playingTrack]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-hidden relative selection:bg-neutral-800">

      <audio
        ref={audioRef}
        onEnded={handleNext}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      {/* --- Top Header / Search Area --- */}
      <motion.div
        className="flex flex-col items-center w-full px-4 sm:px-6"
        initial={false}
        animate={{
          height: isSearched ? "15vh" : "100vh",
          justifyContent: isSearched ? "flex-end" : "center",
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {!isSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8 text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">
              Universal Music Search
            </h1>
            <p className="text-gray-400 text-base sm:text-lg">Describe a vibe, an instrument, or a mood.</p>
          </motion.div>
        )}

        <motion.form
          layout
          onSubmit={handleSearch}
          className={`relative flex items-center w-full max-w-2xl transition-all duration-300 ${isSearched ? "mb-4 sm:mb-6" : ""
            }`}
        >
          <Search className="absolute left-5 sm:left-6 text-neutral-400 w-5 h-5 sm:w-6 sm:h-6" />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Cyberpunk synthwave for a coding session..."
            // Added extra right padding (pr-14) so text doesn't hide behind the X button
            className="w-full pl-14 sm:pl-16 pr-14 py-4 sm:py-5 bg-neutral-900 border border-neutral-800 rounded-full text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow shadow-lg placeholder:text-neutral-600 disabled:opacity-50"
          />

          {/* NEW: The "Start Over" (Clear) Button */}
          {isSearched && (
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </motion.form>
      </motion.div>

      {/* --- Loading State --- */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-20 px-4 text-center">
          <Loader2 className="w-10 h-10 text-neutral-500 animate-spin mb-4" />
          <p className="text-neutral-400 animate-pulse">Running AI Model on RunPod...</p>
        </motion.div>
      )}

      {/* --- Music Results Grid --- */}
      {!isLoading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-40"
        >
          <p className="text-gray-400 mb-6 flex items-center gap-2 text-sm sm:text-base">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
            <span>AI generated {results.length} results for <span className="text-white">"{searchedQuery}"</span></span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {results.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handlePlayTrack(track)}
                className={`group relative bg-neutral-900 border ${playingTrack?.id === track.id ? 'border-neutral-500 shadow-md shadow-white/5' : 'border-neutral-800'} rounded-2xl p-4 sm:p-5 hover:bg-neutral-800 transition-all cursor-pointer`}
              >
                <div className="w-full h-36 sm:h-40 bg-neutral-950 rounded-xl mb-4 flex items-center justify-center border border-neutral-800 group-hover:border-neutral-700 transition-colors relative overflow-hidden">
                  <Music className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-700" />
                  <div className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center rounded-xl transition-all duration-300 ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && isPlaying ? (
                      <Pause className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white" />
                    ) : (
                      <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white ml-1" />
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-base sm:text-lg text-white mb-1 pr-2 truncate">{track.title}</h3>
                <p className="text-neutral-400 text-xs sm:text-sm mb-4 truncate">{track.artist}</p>

                <div className="flex flex-wrap gap-2">
                  {track.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-[10px] sm:text-xs text-neutral-300 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* --- Floating Audio Player --- */}
      <AnimatePresence>
        {playingTrack && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            // REFINED UI: Changes shape and layout depending on mobile (sm:hidden) vs desktop (sm:flex)
            className="fixed bottom-4 inset-x-4 sm:bottom-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] sm:max-w-3xl bg-neutral-900/95 backdrop-blur-2xl border border-neutral-800 sm:border-neutral-700 rounded-2xl sm:rounded-full shadow-2xl overflow-hidden flex flex-col sm:flex-row z-50"
          >
            {/* Inner Content Wrapper */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 w-full">

              {/* Left: Info */}
              <div className="flex items-center gap-3 sm:gap-4 w-1/2 sm:w-1/3 overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500" />
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <h4 className="text-white font-medium text-sm sm:text-base truncate">{playingTrack.title}</h4>
                  <p className="text-neutral-400 text-xs truncate">{playingTrack.artist}</p>
                </div>
              </div>

              {/* Center: Controls */}
              <div className="flex items-center gap-4 sm:gap-6 justify-end sm:justify-center pr-2 sm:pr-0">
                <button
                  onClick={handlePrev}
                  className={`p-2 transition-colors ${results.findIndex(t => t.id === playingTrack.id) > 0 ? 'text-neutral-400 hover:text-white' : 'text-neutral-800'}`}
                >
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0 shadow-lg shadow-white/10"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className={`p-2 transition-colors ${results.findIndex(t => t.id === playingTrack.id) < results.length - 1 ? 'text-neutral-400 hover:text-white' : 'text-neutral-800'}`}
                >
                  <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                </button>
              </div>

              {/* Right: Desktop Progress Bar (Hidden on Mobile) */}
              <div className="hidden sm:flex w-1/3 items-center gap-3 justify-end">
                <span className="text-[11px] text-neutral-500 font-mono w-8 text-right">
                  {formatTime(currentTime)}
                </span>

                <div
                  ref={desktopProgressBarRef}
                  onClick={(e) => handleSeek(e, false)}
                  className="flex-1 h-2 bg-neutral-950 border border-neutral-800 rounded-full overflow-hidden cursor-pointer group flex items-center relative"
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-neutral-300 rounded-full transition-all duration-100 ease-linear group-hover:bg-white"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>

                <span className="text-[11px] text-neutral-500 font-mono w-8 text-left">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Bottom: Mobile Progress Bar (Hidden on Desktop) */}
            {/* This spans the absolute bottom edge of the player! */}
            <div
              ref={mobileProgressBarRef}
              onClick={(e) => handleSeek(e, true)}
              className="sm:hidden w-full h-1 bg-neutral-950 relative cursor-pointer group"
            >
              {/* Hitbox padding so it's easier to tap on mobile */}
              <div className="absolute inset-x-0 bottom-0 h-4 -top-2 z-10" />
              <div
                className="absolute left-0 top-0 h-full bg-white transition-all duration-100 ease-linear group-hover:bg-green-400"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}