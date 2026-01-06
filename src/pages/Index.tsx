import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Trash2, Sparkles, Code, MessageCircle, Image, Video, Shield, Mic, Film, User, LogOut, History, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHistory from "@/components/ChatHistory";
import AuthDialog from "@/components/AuthDialog";
import MediaGenDialog from "@/components/MediaGenDialog";
import { useChatWithHistory } from "@/hooks/useChatWithHistory";
import { useAuth } from "@/contexts/AuthContext";

type AIMode = "tobigpt" | "rozhovor" | "genob" | "video" | "pentest" | "voice" | "mediagen";

const modeConfig = {
  tobigpt: {
    icon: Code,
    label: "TobiGpt",
    description: "ULTRA Programovanie & Generovanie",
    color: "from-blue-500 to-cyan-500",
  },
  rozhovor: {
    icon: MessageCircle,
    label: "Rozhovor",
    description: "Priateľský Chat",
    color: "from-purple-500 to-pink-500",
  },
  genob: {
    icon: Image,
    label: "Gen. Ob.",
    description: "Ultra HD Obrázky",
    color: "from-orange-500 to-yellow-500",
  },
  video: {
    icon: Video,
    label: "Video",
    description: "Reálne Video Generovanie",
    color: "from-green-500 to-emerald-500",
  },
  pentest: {
    icon: Shield,
    label: "PentestGPT",
    description: "ELITE Etické Hackovanie",
    color: "from-red-500 to-rose-500",
  },
  voice: {
    icon: Mic,
    label: "Voice",
    description: "Hlasový Rozhovor",
    color: "from-indigo-500 to-violet-500",
  },
  mediagen: {
    icon: Film,
    label: "MediaGen",
    description: "Video/MP3 s Hlasom",
    color: "from-amber-500 to-orange-500",
  },
};

const Index = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [currentMode, setCurrentMode] = useState<AIMode>("tobigpt");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showMediaGen, setShowMediaGen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChatWithHistory({
    mode: currentMode,
    conversationId,
    onConversationCreated: setConversationId,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = () => {
    clearMessages();
    setConversationId(null);
    toast({ title: "Chat vymazaný", description: "Nový rozhovor začína!" });
  };

  const handleModeChange = (mode: AIMode) => {
    if (mode === "mediagen") {
      setShowMediaGen(true);
      return;
    }
    setCurrentMode(mode);
    clearMessages();
    setConversationId(null);
    toast({ 
      title: `Režim: ${modeConfig[mode].label}`, 
      description: modeConfig[mode].description 
    });
  };

  const handleSelectConversation = (id: string | null) => {
    setConversationId(id);
    if (!id) {
      clearMessages();
    }
    setShowHistory(false);
  };

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  const getSuggestions = () => {
    switch (currentMode) {
      case "tobigpt":
        return [
          "Vytvor hru had v Pythone 🐍",
          "Napíš webstránku s CSS animáciami ✨",
          "Vytvor REST API v Node.js 🚀",
          "Generuj React komponent 💻",
        ];
      case "rozhovor":
        return [
          "Ahoj, ako sa máš? 👋",
          "Povedz mi niečo zaujímavé 🤔",
          "Kto ťa vytvoril? 🎨",
          "Čo všetko vieš? 🌟",
        ];
      case "genob":
        return [
          "Ultra HD západ slnka nad oceánom 🌅",
          "Futuristické cyber mesto v noci 🏙️",
          "Fotorealistický portrét robota 🤖",
          "Epic fantasy krajina s drakom 🏔️",
        ];
      case "video":
        return [
          "Hviezdy a galaxie vo vesmíre 🌌",
          "Vlny na pláži pri západe slnka 🌊",
          "Les s padajúcimi listami 🍂",
          "Aurora borealis nad horami 🏔️",
        ];
      case "pentest":
        return [
          "Ukáž mi SQL injection príklad 💉",
          "Ako funguje XSS útok? 🔓",
          "Nmap skenovanie - príklady 🔍",
          "Burp Suite tutoriál 🛡️",
        ];
      case "voice":
        return [
          "Ahoj, porozprávaj mi vtip 😄",
          "Aké je dnes počasie? ☀️",
          "Povedz mi zaujímavý fakt 🧠",
          "Motivuj ma do práce! 💪",
        ];
      default:
        return [];
    }
  };

  const getWelcomeMessage = () => {
    switch (currentMode) {
      case "tobigpt":
        return "ULTRA programátor! Viem písať milióny riadkov kódu v akomkoľvek jazyku!";
      case "rozhovor":
        return "Som tu na super priateľský rozhovor o čomkoľvek!";
      case "genob":
        return "Generujem ULTRA HD fotorealistické obrázky v 8K kvalite!";
      case "video":
        return "Vytvorím ti REÁLNE video podľa tvojho opisu!";
      case "pentest":
        return "ELITE PentestGPT - naučím ťa etické hackovanie s reálnymi príkladmi!";
      case "voice":
        return "Napíš mi správu a ja ti odpoviem - môžeš si to aj vypočuť!";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user && (
              <Sheet open={showHistory} onOpenChange={setShowHistory}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <History className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b">
                      <h2 className="font-semibold flex items-center gap-2">
                        <History className="w-5 h-5" />
                        História chatov
                      </h2>
                    </div>
                    <ChatHistory 
                      onSelectConversation={handleSelectConversation}
                      currentConversationId={conversationId}
                      currentMode={currentMode}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center animate-float`}>
              <ModeIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {config.label}
                <Sparkles className="w-5 h-5 text-accent" />
              </h1>
              <p className="text-xs text-muted-foreground">Vytvoril Tobias Kromka</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="rounded-xl"
                  title="Odhlásiť sa"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
                className="rounded-xl gap-2"
              >
                <User className="w-4 h-4" />
                Prihlásiť sa
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mode Navigation Tabs */}
      <nav className="sticky top-[73px] z-10 bg-background/95 backdrop-blur border-b px-4 py-2">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(modeConfig) as AIMode[]).map((mode) => {
            const Icon = modeConfig[mode].icon;
            const isActive = currentMode === mode;
            return (
              <Button
                key={mode}
                variant={isActive ? "default" : "ghost"}
                onClick={() => handleModeChange(mode)}
                className={`rounded-full flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? `bg-gradient-to-r ${modeConfig[mode].color} text-white shadow-lg` 
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{modeConfig[mode].label}</span>
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
        <ScrollArea className="flex-1 py-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-6 animate-bounce`}>
                <ModeIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ahoj! Som {config.label} 🚀</h2>
              <p className="text-muted-foreground max-w-md mb-2">
                {getWelcomeMessage()}
              </p>
              <p className="text-xs text-muted-foreground mb-6">Vytvoril ma Tobias Kromka</p>
              {!user && (
                <p className="text-sm text-primary mb-4">
                  💡 Prihlás sa pre ukladanie histórie chatov!
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {getSuggestions().map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className={`rounded-full border-2 hover:border-primary hover:bg-primary/5`}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  isBlocked={message.isBlocked}
                  imageUrl={message.imageUrl}
                  videoUrl={message.videoUrl}
                  audioUrl={message.audioUrl}
                  mode={currentMode}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 items-start">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <ModeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="chat-bubble chat-bubble-assistant">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="sticky bottom-0 py-4 bg-gradient-to-t from-background via-background to-transparent">
          <ChatInput 
            onSend={sendMessage} 
            isLoading={isLoading} 
            mode={currentMode}
            allowImage={currentMode === "video"}
            allowVoice={currentMode === "voice"}
          />
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <MediaGenDialog open={showMediaGen} onOpenChange={setShowMediaGen} />
    </div>
  );
};

export default Index;
