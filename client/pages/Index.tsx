import { useState } from "react";
import M3u8Player from "@/components/M3u8Player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Copy, CheckCircle } from "lucide-react";

export default function Index() {
  const [m3u8Url, setM3u8Url] = useState("");
  const [playerUrl, setPlayerUrl] = useState("");
  const [useReferer, setUseReferer] = useState(false);
  const [referer, setReferer] = useState("");
  const [copied, setCopied] = useState(false);

  const handleLoadStream = () => {
    if (m3u8Url.trim()) {
      setPlayerUrl(m3u8Url);
    }
  };

  const handleClearStream = () => {
    setPlayerUrl("");
    setM3u8Url("");
    setReferer("");
    setUseReferer(false);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(m3u8Url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLoadStream();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Stream Player</h1>
              <p className="text-slate-400 text-sm mt-1">
                M3U8 HLS Stream Player with Optional Referer Header
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-slate-400">Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-1">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-24">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Stream Configuration
                </h2>

                {/* M3U8 URL Input */}
                <div className="space-y-3 mb-6">
                  <div>
                    <Label
                      htmlFor="m3u8-url"
                      className="text-sm font-medium text-slate-200 mb-2 block"
                    >
                      M3U8 Stream URL
                    </Label>
                    <div className="relative">
                      <Input
                        id="m3u8-url"
                        type="text"
                        placeholder="https://example.com/stream.m3u8"
                        value={m3u8Url}
                        onChange={(e) => setM3u8Url(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                      />
                      {m3u8Url && (
                        <button
                          onClick={handleCopyUrl}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-600 rounded transition-colors"
                          title="Copy URL"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Load Stream Button */}
                  <Button
                    onClick={handleLoadStream}
                    disabled={!m3u8Url.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Load Stream
                  </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700 my-6"></div>

                {/* Referer Header Option */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="use-referer"
                        className="text-sm font-medium text-slate-200 cursor-pointer"
                      >
                        Use Referer Header
                      </Label>
                      <p className="text-xs text-slate-400 mt-1">
                        Optional: Add custom Referer header for streaming
                      </p>
                    </div>
                    <Switch
                      id="use-referer"
                      checked={useReferer}
                      onCheckedChange={setUseReferer}
                    />
                  </div>

                  {/* Referer Input */}
                  {useReferer && (
                    <div className="pt-2 border-t border-slate-700">
                      <Label
                        htmlFor="referer"
                        className="text-sm font-medium text-slate-200 mb-2 block"
                      >
                        Referer Value
                      </Label>
                      <Input
                        id="referer"
                        type="text"
                        placeholder="https://example.com"
                        value={referer}
                        onChange={(e) => setReferer(e.target.value)}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        The Referer header will be sent with all stream requests
                      </p>
                    </div>
                  )}
                </div>

                {/* Clear Button */}
                {playerUrl && (
                  <div className="mt-6">
                    <Button
                      onClick={handleClearStream}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Clear Stream
                    </Button>
                  </div>
                )}

                {/* Info Section */}
                <div className="mt-6 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                  <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase">
                    Supported Formats
                  </h3>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• HLS (HTTP Live Streaming)</li>
                    <li>• M3U8 playlists</li>
                    <li>• MPEG-TS streams</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Content - Player */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Player Card */}
              <Card className="border-slate-700 bg-slate-900/50 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Video Player
                  </h2>
                  <M3u8Player
                    url={playerUrl}
                    referer={useReferer ? referer : undefined}
                  />
                </div>
              </Card>

              {/* Stream Info */}
              {playerUrl && (
                <Card className="border-slate-700 bg-slate-900/50">
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">
                      Current Stream Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">URL</p>
                        <p className="text-sm text-white font-mono break-all bg-slate-800/50 p-2 rounded border border-slate-700">
                          {playerUrl}
                        </p>
                      </div>
                      {useReferer && referer && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">
                            Referer Header
                          </p>
                          <p className="text-sm text-white font-mono break-all bg-slate-800/50 p-2 rounded border border-slate-700">
                            {referer}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Usage Tips */}
              <Card className="border-slate-700 bg-slate-900/50">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">
                    📖 How to Use
                  </h3>
                  <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                    <li>Paste your M3U8 stream URL in the input field</li>
                    <li>
                      Optionally enable the Referer header if your stream
                      requires it
                    </li>
                    <li>Click "Load Stream" or press Enter</li>
                    <li>
                      Use the player controls to play, pause, and adjust volume
                    </li>
                    <li>Click the fullscreen button for immersive viewing</li>
                  </ol>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
