
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Reveal text nicely during the process
    setTimeout(() => setShowText(true), 2500);

    // The progress bar fills up over 4 seconds (the animation duration)
    // The total splash duration in App.tsx is 6s, so it will sit at 100% for 2s.
    const duration = 4000; 
    const interval = 30;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(oldProgress + increment, 100);
      });
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[#800020]/5 blur-3xl animate-pulse"></div>
          <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex flex-col items-center z-10 relative">
        
        {/* Animated Puzzle Logo */}
        <div className="w-48 h-48 mb-6 relative">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-xl">
              <defs>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Outer Triangle Frame (Draws first) */}
              <path 
                d="M100 25 L175 165 H25 L100 25 Z" 
                stroke="#7f1d1d" 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeLinejoin="round" 
                fill="none" 
                className="logo-part-triangle"
              />

              {/* Core Structure (Stacking Up) */}
              <g strokeLinejoin="round" strokeLinecap="round">
                  {/* 2. Bottom Rhombus (Darkest) */}
                  <path 
                    d="M100 180 L150 155 L100 130 L50 155 Z" 
                    fill="#7f1d1d" 
                    stroke="#7f1d1d" 
                    strokeWidth="4" 
                    className="logo-part-rhombus-bottom"
                  />
                  
                  {/* 3. Middle Rhombus (Medium) */}
                  <path 
                    d="M100 145 L140 120 L100 95 L60 120 Z" 
                    fill="#991b1b" 
                    stroke="#991b1b" 
                    strokeWidth="4" 
                    className="logo-part-rhombus-middle"
                  />
                  
                  {/* 4. Top Rhombus (Lightest/Active) */}
                  <path 
                    d="M100 110 L130 90 L100 70 L70 90 Z" 
                    fill="#b91c1c" 
                    stroke="#b91c1c" 
                    strokeWidth="4" 
                    className="logo-part-rhombus-top"
                  />
              </g>
              
              {/* 5. Top Accent Dot (Pops in last) */}
              <circle cx="100" cy="40" r="8" fill="#7f1d1d" className="logo-part-dot" />
            </svg>
        </div>

        {/* Text Container with Fade In */}
        <div className={`text-center transition-all duration-1000 transform ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-3xl font-black text-[#800020] dark:text-red-400 mb-2 tracking-wide">
                نرم افزار دستیار
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-10">
                سامانه هوشمند نگهداری و تعمیرات
            </p>
        </div>

        {/* Minimal Progress Bar (No Percentage Text) */}
        <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative">
            <div 
                className="h-full bg-gradient-to-r from-[#800020] to-red-500 rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(128,0,32,0.5)]"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
      </div>

      <style>{`
        /* 1. Triangle Drawing Animation */
        .logo-part-triangle {
            stroke-dasharray: 600;
            stroke-dashoffset: 600;
            opacity: 0.3;
            animation: drawTriangle 2.5s ease-out forwards;
        }
        @keyframes drawTriangle {
            0% { stroke-dashoffset: 600; opacity: 0; }
            100% { stroke-dashoffset: 0; opacity: 0.3; }
        }

        /* 2. Rhombus Assembly Animations */
        /* Staggered to complete by approx 3.8s */
        .logo-part-rhombus-bottom {
            opacity: 0;
            transform-origin: center;
            animation: assemblePart 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            animation-delay: 0.8s;
        }
        .logo-part-rhombus-middle {
            opacity: 0;
            transform-origin: center;
            animation: assemblePart 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            animation-delay: 1.6s;
        }
        .logo-part-rhombus-top {
            opacity: 0;
            transform-origin: center;
            animation: assemblePart 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            animation-delay: 2.4s;
        }

        @keyframes assemblePart {
            0% { opacity: 0; transform: translateY(25px) scale(0.8); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* 3. Dot Pop In (Last piece) */
        .logo-part-dot {
            opacity: 0;
            transform-origin: center;
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 3.2s;
        }
        @keyframes popIn {
            0% { opacity: 0; transform: scale(0); }
            100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
