'use client';

import { useState } from 'react';
import { Loader2, Link as LinkIcon, Search, AlertCircle, Hash } from 'lucide-react';

interface LinkData {
  title: string;
  description: string;
  tags: string[];
  platform: 'youtube' | 'tiktok';
  originalUrl: string;
}

function getEmbedUrl(url: string, platform: string) {
  try {
    if (platform === 'youtube') {
      const urlObj = new URL(url);
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (platform === 'tiktok') {
      const match = url.match(/\/video\/(\d+)/);
      const videoId = match ? match[1] : '';
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
  } catch (e) {
    return '';
  }
  return url;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<LinkData | null>(null);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to process link');
      }

      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-20 relative z-10 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center space-y-6 mb-16 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <LinkIcon className="w-4 h-4" />
            <span>Link Saver MVP</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-neutral-400 bg-clip-text text-transparent">
            Save & Extract
            <br />
            Video Links Instantly.
          </h1>
          <p className="text-lg text-neutral-400 font-medium">
            Paste a YouTube or TikTok link below. We'll extract the title, description, and tags automatically while embedding the video for you.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleProcess} className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <div className="relative flex items-center bg-neutral-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl">
            <div className="pl-4 pr-2 text-neutral-500 group-focus-within:text-purple-400 transition-colors">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or TikTok URL here..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500 text-lg py-4 px-2 w-full focus:ring-0"
              required
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="ml-2 bg-white text-black font-semibold px-6 py-4 rounded-xl hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  Process Link
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mt-8 flex items-center gap-3 text-red-400 bg-red-950/40 border border-red-500/20 px-6 py-4 rounded-xl w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Result Card */}
        {data && (
          <div className="mt-16 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-neutral-900/60 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/5 hover:ring-white/10 transition-all duration-500">
              
              {/* Video Embed */}
              <div className="w-full aspect-video bg-black relative border-b border-white/10 flex items-center justify-center">
                <iframe
                  src={getEmbedUrl(data.originalUrl, data.platform)}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Metadata Content */}
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {data.title}
                  </h2>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest flex-shrink-0 shadow-inner ${
                    data.platform === 'youtube' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-red-500/10' 
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-cyan-500/10'
                  }`}>
                    {data.platform}
                  </div>
                </div>

                <p className="text-neutral-400 line-clamp-3 mb-8 leading-relaxed font-medium">
                  {data.description}
                </p>

                {data.tags && data.tags.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-neutral-500 font-semibold uppercase tracking-wider">
                      <Hash className="w-4 h-4" />
                      Extracted Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.slice(0, 10).map((tag, i) => (
                        <span 
                          key={i}
                          className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-neutral-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all cursor-default shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                      {data.tags.length > 10 && (
                        <span className="px-4 py-1.5 bg-neutral-900/50 border border-white/5 rounded-lg text-sm text-neutral-500 font-medium">
                          +{data.tags.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
