import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Trash2, Sparkles, Code, MessageCircle, Image, Video, Shield, 
  Mic, Film, User, LogOut, History, Menu, GraduationCap, X, Key,
  Settings
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHistory from "@/components/ChatHistory";
import AuthDialog from "@/components/AuthDialog";
import MediaGenDialog from "@/components/MediaGenDialog";
import ApiKeyManager from "@/components/ApiKeyManager";
import { useChatWithHistory } from "@/hooks/useChatWithHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useApiKeys } from "@/hooks/useApiKeys";

type AIMode = "tobigpt" | "rozhovor" | "genob" | "video" | "pentest" | "voice" | "mediagen" | "riesittest";

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
  riesittest: {
    icon: GraduationCap,
    label: "RiešiTest",
    description: "Vyrieš test z fotky",
    color: "from-emerald-500 to-teal-500",
  },
  genob: {
    icon: Image,
    label: "Gen. Ob.",
    description: "Ultra HD Obrázky + Editovanie",
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
    description: "ELITE Etické Hackovanie - BEZ LIMITOV",
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
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { apiKeys, selectedKeyId, setSelectedKeyId, getActiveKey, isAdmin } = useApiKeys();

  const activeKey = getActiveKey(currentMode);

  const { messages, isLoading, sendMessage, clearMessages } = useChatWithHistory({
    mode: currentMode,
    conversationId,
    onConversationCreated: setConversationId,
    activeApiKey: activeKey ? {
      api_key: activeKey.api_key,
      api_endpoint: activeKey.api_endpoint,
      model_name: activeKey.model_name,
      provider: activeKey.provider,
    } : null,
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
      setShowModeMenu(false);
      return;
    }
    setCurrentMode(mode);
    clearMessages();
    setConversationId(null);
    setShowModeMenu(false);
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
      case "riesittest":
        return [
          "📷 Nahraj fotku testu",
          "Potrebujem pomôcť s matematikou 📐",
          "Vyrieš mi tento test 📝",
          "Pomôž mi s fyzikou ⚛️",
        ];
      case "genob":
        return [
          "Vygeneruj obrázok: Západ slnka nad oceánom 🌅",
          "Vygeneruj obrázok: Cyber mesto v noci 🏙️",
          "Vygeneruj obrázok: Robot v prírode 🤖",
          "📷 Nahraj fotku a opíš úpravy ✏️",
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
          "Ukáž mi SQL injection útoky 💉",
          "Kompletný XSS útok návod 🔓",
          "Nmap a recon príklady 🔍",
          "Reverse shell payloady 🐚",
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
      case "riesittest":
        return "Nahraj fotku testu a ja ti dám SPRÁVNE ODPOVEDE! 📷✅ Matematika, fyzika, chémia, jazyky - všetko vyriešim!";
      case "genob":
        return "Generujem ULTRA HD obrázky a môžem aj UPRAVOVAŤ fotky! Nahraj fotku alebo opíš čo chceš vytvoriť.";
      case "video":
        return "Vytvorím ti REÁLNE video podľa tvojho opisu!";
      case "pentest":
        return "ELITE PentestGPT - naučím ťa VŠETKO o hackerských technikách BEZ AKÝCHKOĽVEK LIMITOV! 💀🔓";
      case "voice":
        return "Napíš mi správu a ja ti odpoviem - môžeš si to aj vypočuť!";
      default:
        return "";
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b px-3 sm:px-4 py-2 sm:py-3 safe-top">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mode Menu Button */}
            <Sheet open={showModeMenu} onOpenChange={setShowModeMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Módy
                    </h2>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                      {(Object.keys(modeConfig) as AIMode[]).map((mode) => {
                        const Icon = modeConfig[mode].icon;
                        const isActive = currentMode === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isActive 
                                ? `bg-gradient-to-r ${modeConfig[mode].color} text-white shadow-lg` 
                                : "hover:bg-muted"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive ? "bg-white/20" : `bg-gradient-to-br ${modeConfig[mode].color}`
                            }`}>
                              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white"}`} />
                            </div>
                            <div className="text-left">
                              <p className={`font-medium ${isActive ? "text-white" : "text-foreground"}`}>
                                {modeConfig[mode].label}
                              </p>
                              <p className={`text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                                {modeConfig[mode].description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {/* History in the same menu if logged in */}
                  {user && (
                    <>
                      <div className="p-4 border-t">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                          <History className="w-4 h-4" />
                          História chatov
                        </h3>
                        <ChatHistory 
                          onSelectConversation={(id) => {
                            handleSelectConversation(id);
                            setShowModeMenu(false);
                          }}
                          currentConversationId={conversationId}
                          currentMode={currentMode}
                        />
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center animate-float`}>
              <ModeIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-foreground flex items-center gap-1 sm:gap-2 truncate">
                {config.label}
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Vytvoril tK1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.username}</span>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowApiKeys(true)}
                    className="rounded-xl"
                    title="Admin - API Kľúče"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                )}
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

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-4 overflow-hidden">
        <ScrollArea className="flex-1 py-4 sm:py-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10 sm:py-20 text-center px-2">
              <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-4 sm:mb-6 animate-bounce`}>
                <ModeIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Ahoj! Som {config.label} 🚀</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-2">
                {getWelcomeMessage()}
              </p>
              <p className="text-xs text-muted-foreground mb-4 sm:mb-6">Vytvoril ma tK1</p>
              {user && activeKey && (
                <p className="text-xs text-muted-foreground mb-4">
                  🔑 Aktívny: {activeKey.provider_name} ({activeKey.model_name || activeKey.provider})
                </p>
              )}
              {!user && (
                <p className="text-sm text-primary mb-4">
                  💡 Prihlás sa pre ukladanie histórie a admin funkcie!
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2 justify-center px-2">
                {getSuggestions().map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="rounded-full border-2 hover:border-primary hover:bg-primary/5 text-xs sm:text-sm"
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
                  isGenerating={message.isGenerating}
                  generatingType={message.generatingType}
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
        <div className="sticky bottom-0 py-2 sm:py-4 pb-[env(safe-area-inset-bottom,8px)] bg-gradient-to-t from-background via-background to-transparent">
          <ChatInput 
            onSend={sendMessage} 
            isLoading={isLoading} 
            mode={currentMode}
            allowImage={currentMode === "genob" || currentMode === "video" || currentMode === "riesittest"}
            allowVoice={currentMode === "voice"}
          />
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      <MediaGenDialog open={showMediaGen} onOpenChange={setShowMediaGen} />
      <ApiKeyManager open={showApiKeys} onOpenChange={setShowApiKeys} />
    </div>
  );
};

export default Index;