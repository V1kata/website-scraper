import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const isYouTube = parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');
    const isTikTok = parsedUrl.hostname.includes('tiktok.com');

    if (!isYouTube && !isTikTok) {
      return NextResponse.json({ error: 'Only YouTube and TikTok URLs are supported' }, { status: 400 });
    }

    let title = '';
    let description = '';
    let tags: string[] = [];
    let transcript = '';
    let html = '';

    // Attempt to fetch standard oEmbed for fallback if HTML parsing fails
    let authorName = '';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (response.ok) {
      html = await response.text();
      const $ = cheerio.load(html);

      title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      
      if (isYouTube) {
        const keywords = $('meta[name="keywords"]').attr('content');
        if (keywords) {
          tags = keywords.split(',').map(tag => tag.trim()).filter(Boolean);
        }
      } else if (isTikTok) {
        const hashtags = description.match(/#[\w]+/g);
        if (hashtags) {
          tags = hashtags.map(tag => tag.trim());
        }
      }
    }

    // Always fetch oEmbed to get authorName, and fallback for title
    if (isYouTube) {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (!title) title = oembedData.title || '';
        authorName = oembedData.author_name || '';
      }
    } else if (isTikTok) {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (!title) title = oembedData.title || '';
        authorName = oembedData.author_name || '';
      }
    }

    // Clean up title
    if (title && isTikTok && title.includes(' on TikTok')) {
      title = title.replace(' on TikTok', '');
    }

    // Extract Transcript
    if (isYouTube) {
      try {
        // Handle YouTube Shorts URLs by extracting video ID and converting to standard format
        let transcriptUrl = url;
        if (parsedUrl.pathname.startsWith('/shorts/')) {
          const videoId = parsedUrl.pathname.split('/')[2];
          if (videoId) {
            transcriptUrl = `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
        
        const transcriptData = await YoutubeTranscript.fetchTranscript(transcriptUrl);
        if (transcriptData && transcriptData.length > 0) {
          transcript = transcriptData.map(item => item.text).join(' ');
        }
      } catch (err) {
        console.log('No transcript available or fetching failed for YouTube:', err);
      }
    } else if (isTikTok && html) {
      // Attempt to extract TikTok closed captions from the hydration data
      try {
        const match = html.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__.*?>(.*?)</);
        if (match && match[1]) {
          const data = JSON.parse(match[1]);
          // This is a naive attempt to find subtitles within the deeply nested TikTok JSON
          const jsonStr = JSON.stringify(data);
          const subtitleMatches = jsonStr.match(/"subtitles":\[(.*?)\]/);
          if (subtitleMatches) {
             // Subtitles exist, but we might not easily parse them without knowing the exact current schema
             transcript = 'Auto-captions exist but cannot be fully extracted at this time.';
          }
        }
      } catch (e) {
        console.log('Failed to parse TikTok transcript data');
      }
    }

    return NextResponse.json({
      title: title || 'Unknown Title',
      description: description || 'No description available',
      tags,
      authorName,
      transcript,
      platform: isYouTube ? 'youtube' : 'tiktok',
      originalUrl: url
    });

  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract metadata' }, { status: 500 });
  }
}
