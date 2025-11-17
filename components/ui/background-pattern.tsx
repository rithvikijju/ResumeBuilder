"use client";

export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Simplified animated gradient orbs - reduced blur for better performance */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-2xl animate-float will-change-transform" style={{ transform: 'translateZ(0)' }} />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-2xl animate-float will-change-transform" style={{ animationDelay: '2s', transform: 'translateZ(0)' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400/10 rounded-full blur-2xl animate-float will-change-transform" style={{ animationDelay: '4s', transform: 'translateZ(0)' }} />
      
      {/* Simplified grid - use CSS instead of SVG for better performance */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: 'linear-gradient(rgba(37, 99, 235, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'translateZ(0)'
        }} 
      />
    </div>
  );
}

