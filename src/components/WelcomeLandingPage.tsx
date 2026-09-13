import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeLandingPageProps {
  onStart: () => void;
}

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({ onStart }) => {
  // Parallax 3D tilt tracking for mouse/touch
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isEntering, setIsEntering] = useState(true);
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    setMousePos({ x, y });
  };

  const handleButtonClick = () => {
    setIsRippling(true);
    setTimeout(() => {
      onStart();
    }, 250);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full bg-[#0a0718] light:bg-[#f8f9fe] text-slate-100 light:text-slate-900 flex flex-col justify-between items-center p-6 sm:p-8 lg:p-12 relative overflow-hidden select-none"
    >
      {/* Living Ambient Gradients & Glow Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-pink/25 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-purple/30 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Clean Minimal Header Logo Only */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center relative z-20 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-lg shadow-brand-purple/40">
            <div className="w-full h-full bg-[#110d24] light:bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-black text-base">
              N
            </div>
          </div>
          <span className="font-black text-xl tracking-tight text-white light:text-slate-900">
            Notiq<span className="text-brand-pink">AI</span>
          </span>
        </div>
      </div>

      {/* MAIN CENTER HERO CONTAINER (MINIMAL & 3D ANIMATED) */}
      <div className={`w-full max-w-2xl mx-auto text-center space-y-10 my-auto relative z-20 transition-all duration-700 ${
        isEntering ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
      }`}>
        
        {/* CENTER 3D NOTIQ AI LOGO STAGE */}
        <div className="relative w-full max-w-xs mx-auto py-6 flex items-center justify-center">
          <div 
            className="relative w-36 h-36 sm:w-44 sm:h-44 transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1000px) rotateX(${mousePos.y * -15}deg) rotateY(${mousePos.x * 15}deg)`,
            }}
          >
            {/* Pulsing Glow Rings */}
            <div className="absolute inset-0 rounded-[46px] bg-gradient-to-tr from-brand-purple via-brand-pink to-brand-purple blur-2xl opacity-90 animate-pulse" />
            <div className="absolute -inset-3 rounded-[50px] bg-brand-pink/40 blur-3xl opacity-70" />

            {/* Outer 3D Metallic Bezel */}
            <div className="relative w-full h-full rounded-[46px] bg-gradient-to-tr from-brand-purple via-brand-pink to-brand-purple p-1.5 shadow-[0_25px_60px_rgba(255,111,181,0.55)]">
              <div className="w-full h-full bg-[#110d24] light:bg-slate-900 rounded-[40px] flex items-center justify-center text-white text-7xl sm:text-8xl font-black tracking-tight border border-white/25 shadow-inner">
                N
              </div>
            </div>
          </div>
        </div>

        {/* TYPOGRAPHY SECTION */}
        <div className="space-y-4 max-w-xl mx-auto px-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white light:text-slate-900 drop-shadow-[0_15px_30px_rgba(108,59,255,0.6)]">
            Welcome to Notiq<span className="text-brand-pink">AI</span>
          </h1>
          
          <h2 className="text-base sm:text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-purple-200 to-brand-pink tracking-tight">
            Learn Smarter. Remember Better.
          </h2>
        </div>

        {/* SINGLE MAIN ACTION BUTTON: ✨ Let's Start */}
        <div className="pt-2 max-w-xs sm:max-w-sm mx-auto">
          <button
            onClick={handleButtonClick}
            className={`w-full py-4 sm:py-5 px-6 sm:px-10 rounded-full bg-gradient-to-r from-brand-purple via-brand-pink to-brand-purple text-white font-black text-base sm:text-lg tracking-wide shadow-[0_20px_50px_rgba(255,111,181,0.55)] hover:shadow-[0_25px_65px_rgba(255,111,181,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group relative overflow-hidden ${
              isRippling ? 'scale-95 opacity-80' : ''
            }`}
          >
            {/* Shimmer Highlight */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            <span>✨ Let's Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

      </div>

      {/* Clean Minimal Footer */}
      <div className="w-full max-w-7xl mx-auto text-center relative z-20 pt-4 pb-2">
        <p className="text-[11px] text-slate-400 light:text-slate-600 font-medium">
          Notiq AI • Learn Smarter. Remember Better.
        </p>
      </div>

    </div>
  );
};
