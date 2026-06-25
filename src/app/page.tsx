"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Music, Pause, SkipForward, SkipBack, Loader2 } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  // NEW: This remembers what we ACTUALLY searched for, not what we are typing
  const [searchedQuery, setSearchedQuery] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const [playingTrack, setPlayingTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length === 0) return;

    // Lock in the query that we are actually sending to the AI
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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;

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
    <div className="min-h-screen bg-neutral-950 text-white font-sans overflow-hidden relative">

      <audio
        ref={audioRef}
        onEnded={handleNext}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
      />

      <motion.div
        className="flex flex-col items-center w-full px-4"
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
            className="mb-8 text-center"
          >
            <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">
              Universal Music Search
            </h1>
            <p className="text-gray-400 text-lg">Describe a vibe, an instrument, or a mood.</p>
          </motion.div>
        )}

        <motion.form
          layout
          onSubmit={handleSearch}
          className={`relative flex items-center w-full max-w-2xl transition-all duration-300 ${isSearched ? "mb-6" : ""
            }`}
        >
          <Search className="absolute left-6 text-gray-400 w-6 h-6" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Cyberpunk synthwave for a coding session..."
            className="w-full pl-16 pr-6 py-5 bg-neutral-900 border border-neutral-800 rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-white/20 transition-shadow shadow-lg placeholder:text-neutral-500 disabled:opacity-50"
          />
        </motion.form>
      </motion.div>

      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center mt-20">
          <Loader2 className="w-10 h-10 text-neutral-500 animate-spin mb-4" />
          <p className="text-neutral-400 animate-pulse">Running AI Model on RunPod...</p>
        </motion.div>
      )}

      {!isLoading && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 py-8 pb-40"
        >
          <p className="text-gray-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {/* UPDATE: Now it uses searchedQuery, so it stays locked! */}
            AI generated {results.length} results for "{searchedQuery}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => handlePlayTrack(track)}
                className={`group relative bg-neutral-900 border ${playingTrack?.id === track.id ? 'border-white' : 'border-neutral-800'} rounded-2xl p-5 hover:bg-neutral-800 transition-colors cursor-pointer shadow-md`}
              >
                <div className="w-full h-40 bg-neutral-950 rounded-xl mb-4 flex items-center justify-center border border-neutral-800 group-hover:border-neutral-700 transition-colors relative overflow-hidden">
                  <Music className="w-10 h-10 text-neutral-700" />
                  <div className={`absolute inset-0 h-40 bg-black/40 flex items-center justify-center rounded-xl transition-opacity ${playingTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playingTrack?.id === track.id && isPlaying ? (
                      <Pause className="w-12 h-12 text-white fill-white" />
                    ) : (
                      <Play className="w-12 h-12 text-white fill-white ml-1" />
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-lg text-white mb-1 truncate">{track.title}</h3>
                <p className="text-neutral-400 text-sm mb-4 truncate">{track.artist}</p>

                <div className="flex flex-wrap gap-2">
                  {track.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {playingTrack && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-neutral-900/90 backdrop-blur-xl border border-neutral-700 rounded-full px-6 py-4 flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-4 w-1/3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="truncate">
                <h4 className="text-white font-medium text-sm truncate">{playingTrack.title}</h4>
                <p className="text-neutral-400 text-xs truncate">{playingTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={handlePrev}
                className={`transition-colors ${results.findIndex(t => t.id === playingTrack.id) > 0 ? 'text-neutral-400 hover:text-white' : 'text-neutral-700 cursor-not-allowed'}`}
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={handleNext}
                className={`transition-colors ${results.findIndex(t => t.id === playingTrack.id) < results.length - 1 ? 'text-neutral-400 hover:text-white' : 'text-neutral-700 cursor-not-allowed'}`}
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            <div className="w-1/3 flex items-center gap-3 justify-end hidden sm:flex">
              <span className="text-xs text-neutral-500 font-mono w-8 text-right">
                {formatTime(currentTime)}
              </span>

              <div
                ref={progressBarRef}
                onClick={handleSeek}
                className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden cursor-pointer group flex items-center"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-100 ease-linear group-hover:bg-green-400"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>

              <span className="text-xs text-neutral-500 font-mono w-8 text-left">
                {formatTime(duration)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}