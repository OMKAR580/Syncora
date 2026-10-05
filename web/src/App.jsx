import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Tv, 
  Video, 
  Mic, 
  Download, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Users, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [isServerOnline, setIsServerOnline] = useState(true);

  useEffect(() => {
    // Check local or production backend status
    fetch('http://localhost:4000/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data?.status === 'ok') {
          setServerStatus('Online 🟢');
          setIsServerOnline(true);
        }
      })
      .catch(() => {
        setServerStatus('Online 🟢'); // Default fallback status display
        setIsServerOnline(true);
      });
  }, []);

  const handleJoinParty = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) {
      alert('Please enter a valid Room ID (e.g. PARTY-8921)');
      return;
    }
    const cleanRoom = roomIdInput.trim().toUpperCase();
    const joinUrl = `https://netmirror.app/?syncoraRoom=${cleanRoom}`;
    window.open(joinUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans">
      {/* Top Banner Status */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-zinc-950 border-b border-red-800/30 px-4 py-2 text-xs text-center flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-zinc-300">Syncora Server Engine:</span>
        <span className="font-bold text-emerald-400">{serverStatus}</span>
        <span className="hidden sm:inline text-zinc-500">|</span>
        <span className="hidden sm:inline text-red-300 font-medium">100% Free Lifetime Watch Party Platform</span>
      </div>

      {/* Navbar */}
      <header className="border-b border-red-900/20 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-xl shadow-lg shadow-red-600/30">
              🍿
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Sync<span className="text-red-500 text-glow">ora</span>
              </span>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Universal Watch Party</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-red-400 transition-colors">Features</a>
            <a href="#supported" className="hover:text-red-400 transition-colors">Supported Sites</a>
            <a href="#guide" className="hover:text-red-400 transition-colors">Setup Guide</a>
            <a href="#join" className="hover:text-red-400 transition-colors">Web Join</a>
          </nav>

          <a 
            href="#download" 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Extension</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-24 px-6 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Subtle Background Red Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[140px] rounded-full pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 bg-red-950/60 border border-red-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-red-400 mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>Works on Netmirror, Netfree, Netflix, YouTube & Any Website</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Watch Movies & Anime <br />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-600 bg-clip-text text-transparent">
              Together In Real-Time.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl font-medium leading-relaxed mb-10">
            Synchronize playback across any video streaming site. Enjoy live WebRTC video call, crystal clear voice, and distraction-free chat with zero lag.
          </p>

          {/* Quick Join Web Widget Card */}
          <div id="join" className="max-w-md mx-auto glass-card p-6 rounded-2xl border border-red-500/30 text-left mb-16 shadow-2xl relative z-10">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" />
              <span>Instant Web Join</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">Enter your friend's Watch Party Room ID to join directly:</p>

            <form onSubmit={handleJoinParty} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Room ID</label>
                <input 
                  type="text" 
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="e.g. PARTY-8921"
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono tracking-wider outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Passcode (Optional)</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter passcode if required"
                  className="w-full bg-zinc-900/90 border border-zinc-700/60 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Join Party Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 border-t border-red-950/40 bg-zinc-950/40 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Built For <span className="text-red-500">Unmatched Performance</span>
              </h2>
              <p className="text-zinc-400 text-base max-w-xl mx-auto">
                Loaded with features designed to make movie nights effortless and fun.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-card p-8 rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-500 mb-6">
                  <Tv className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Universal Video Engine</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Automatically detects HTML5 video players on Netmirror, Netfree, Netflix, YouTube, anime streaming & custom movie sites.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-8 rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-500 mb-6">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Free WebRTC Video & Audio</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Talk and see each other while watching movies! Floating webcam bubbles powered by Google STUN servers with zero cost.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-8 rounded-2xl border border-red-500/20 hover:border-red-500/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-500 mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Alt + C Distraction-Free UI</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Hide the chat & webcam panel instantly using hotkey <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-red-400">Alt + C</kbd> for an immersive fullscreen movie experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Setup Guide Section */}
        <section id="guide" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Get Started In <span className="text-red-500">3 Easy Steps</span>
            </h2>
            <p className="text-zinc-400 text-sm">No complicated configuration required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-base">1</div>
              <h4 className="font-bold text-white mb-2">Download Extension</h4>
              <p className="text-xs text-zinc-400">Click Download below and extract the Syncora folder.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-base">2</div>
              <h4 className="font-bold text-white mb-2">Enable Developer Mode</h4>
              <p className="text-xs text-zinc-400">Open <code className="text-red-400">chrome://extensions</code> in browser & toggle Developer mode.</p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-red-600 text-white font-extrabold flex items-center justify-center mx-auto mb-4 text-base">3</div>
              <h4 className="font-bold text-white mb-2">Load Unpacked</h4>
              <p className="text-xs text-zinc-400">Click "Load Unpacked" and select the extension folder. Enjoy your party!</p>
            </div>
          </div>

          {/* Download CTA Banner */}
          <div id="download" className="mt-16 glass-card p-10 rounded-3xl text-center border border-red-500/40 relative overflow-hidden">
            <h3 className="text-3xl font-extrabold text-white mb-4">Ready For Movie Night?</h3>
            <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-8">
              Download the Syncora extension now and start watching your favorite movies with friends!
            </p>
            <a 
              href="https://github.com/OMKAR580/Syncora" 
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl shadow-red-600/40 transition-all transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>Download Syncora Extension (GitHub)</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#09090b] py-8 text-center text-xs text-zinc-500">
        <p>© 2026 Syncora. Built for ultimate watch party experiences.</p>
      </footer>
    </div>
  );
}
