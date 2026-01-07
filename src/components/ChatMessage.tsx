import { cn } from "@/lib/utils";
import { Bot, User, Copy, Download, Check, Volume2, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isBlocked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  mode?: string;
  isGenerating?: boolean;
  generatingType?: "image" | "video";
}

const ChatMessage = ({ role, content, isBlocked, imageUrl, videoUrl, audioUrl, mode, isGenerating, generatingType }: ChatMessageProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Extract code blocks from content
  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string; start: number; end: number }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || "text",
        code: match[2].trim(),
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return blocks;
  };

  const codeBlocks = role === "assistant" ? extractCodeBlocks(content) : [];

  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast({ title: "Skopírované!", description: "Kód bol skopírovaný do schránky" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCode = (code: string, language: string, index: number) => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      sql: "sql",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      markdown: "md",
      bash: "sh",
      shell: "sh",
      text: "txt",
    };

    const ext = extensions[language.toLowerCase()] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${index + 1}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Stiahnuté!", description: `Súbor code-${index + 1}.${ext} bol stiahnutý` });
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Stiahnuté!", description: "Obrázok bol stiahnutý" });
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Stiahnuté!", description: "Video bolo stiahnuté" });
  };

  // Function to speak the message using ElevenLabs TTS
  const handleSpeak = async () => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: content,
            voiceName: "žena",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("TTS failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      toast({ title: "Chyba", description: "Nepodarilo sa prehrať hlas", variant: "destructive" });
    }
  };

  // Render generating state
  const renderGeneratingState = () => {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center animate-pulse">
            {generatingType === "image" ? (
              <ImageIcon className="w-8 h-8 text-primary" />
            ) : (
              <Video className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground">{content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {generatingType === "image" ? "Prosím počkaj, generujem ultra HD obrázok..." : "Prosím počkaj, generujem video..."}
          </p>
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Show generating state if applicable
    if (isGenerating && generatingType) {
      return renderGeneratingState();
    }

    if (role === "user" || codeBlocks.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
    }

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    codeBlocks.forEach((block, index) => {
      if (block.start > lastEnd) {
        const textBefore = content.slice(lastEnd, block.start);
        if (textBefore.trim()) {
          parts.push(
            <p key={`text-${index}`} className="whitespace-pre-wrap leading-relaxed mb-3">
              {textBefore.trim()}
            </p>
          );
        }
      }

      parts.push(
        <div key={`code-${index}`} className="my-3 rounded-xl overflow-hidden border border-border/50">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {block.language}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => copyCode(block.code, index)}
              >
                {copiedIndex === index ? (
                  <Check className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copiedIndex === index ? "Hotovo" : "Kopírovať"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => downloadCode(block.code, block.language, index)}
              >
                <Download className="w-3 h-3 mr-1" />
                Stiahnuť
              </Button>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto bg-foreground/5 text-sm">
            <code className="font-mono">{block.code}</code>
          </pre>
        </div>
      );

      lastEnd = block.end;
    });

    if (lastEnd < content.length) {
      const textAfter = content.slice(lastEnd);
      if (textAfter.trim()) {
        parts.push(
          <p key="text-end" className="whitespace-pre-wrap leading-relaxed mt-3">
            {textAfter.trim()}
          </p>
        );
      }
    }

    return <>{parts}</>;
  };

  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {role === "user" ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      <div
        className={cn(
          "chat-bubble",
          role === "user" ? "chat-bubble-user" : "chat-bubble-assistant",
          isBlocked && "border-destructive/50 bg-destructive/5",
          role === "assistant" && codeBlocks.length > 0 && "max-w-[95%]",
          isGenerating && "min-w-[280px]"
        )}
      >
        {renderContent()}
        
        {/* Image display */}
        {imageUrl && !isGenerating && (
          <div className="mt-3">
            <img 
              src={imageUrl} 
              alt="Generated" 
              className="rounded-xl max-w-full max-h-96 object-contain border border-border/50"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={downloadImage}
            >
              <Download className="w-3 h-3 mr-1" />
              Stiahnuť obrázok
            </Button>
          </div>
        )}

        {/* Video display */}
        {videoUrl && !isGenerating && (
          <div className="mt-3">
            <video 
              src={videoUrl} 
              controls 
              autoPlay
              loop
              className="rounded-xl max-w-full max-h-96 border border-border/50"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={downloadVideo}
            >
              <Download className="w-3 h-3 mr-1" />
              Stiahnuť video
            </Button>
          </div>
        )}

        {/* Audio display */}
        {audioUrl && (
          <div className="mt-3">
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {/* Voice mode - speak button */}
        {role === "assistant" && mode === "voice" && content && !isBlocked && !isGenerating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="mt-2 gap-2 text-muted-foreground hover:text-primary"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
            {isSpeaking ? "Hovorím..." : "Vypočuť odpoveď"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;