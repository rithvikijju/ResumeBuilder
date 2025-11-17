"use client";

export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Geometric shapes */}
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" className="text-blue-600" />
      </svg>
      
      {/* Floating circles */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-blue-500/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 right-20 w-3 h-3 bg-indigo-500/30 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-purple-500/30 rounded-full animate-float" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-blue-500/30 rounded-full animate-float" style={{ animationDelay: '2.5s' }} />
    </div>
  );
}

