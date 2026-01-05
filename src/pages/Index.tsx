import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Sparkles, Bot, Code, MessageCircle, Image, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { useChat } from "@/hooks/useChat";

type AIMode = "tobigpt" | "rozhovor" | "genob" | "video";

const modeConfig = {
  tobigpt: {
    icon: Code,
    label: "TobiGpt",
    description: "Programovanie & Generovanie súborov",
    color: "from-blue-500 to-cyan-500",
  },
  rozhovor: {
    icon: MessageCircle,
    label: "Rozhovor",
    description: "Chat & Konverzácia",
    color: "from-purple-500 to-pink-500",
  },
  genob: {
    icon: Image,
    label: "Gen. Ob.",
    description: "Generovanie obrázkov",
    color: "from-orange-500 to-yellow-500",
  },
  video: {
    icon: Video,
    label: "Video",
    description: "Tvorba videí",
    color: "from-green-500 to-emerald-500",
  },
};

const Index = () => {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<AIMode>("tobigpt");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    mode: currentMode,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = () => {
    clearMessages();
    toast({ title: "Chat vymazaný", description: "Nový rozhovor začína!" });
  };

  const handleModeChange = (mode: AIMode) => {
    setCurrentMode(mode);
    clearMessages();
    toast({ 
      title: `Režim: ${modeConfig[mode].label}`, 
      description: modeConfig[mode].description 
    });
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
          "Vygeneruj obrázok západu slnka 🌅",
          "Nakresli futuristické mesto 🏙️",
          "Vytvor avatar robota 🤖",
          "Vygeneruj fantasy krajinu 🏔️",
        ];
      case "video":
        return [
          "Vytvor video o vesmíre 🌌",
          "Animuj lietajúce vtáky 🦅",
          "Video s morskými vlnami 🌊",
          "Vytvor intro animáciu 🎬",
        ];
    }
  };

  const getWelcomeMessage = () => {
    switch (currentMode) {
      case "tobigpt":
        return "Viem písať kód v akomkoľvek jazyku a generovať kompletné projekty!";
      case "rozhovor":
        return "Som tu na príjemný rozhovor o čomkoľvek!";
      case "genob":
        return "Napíš mi čo chceš a ja ti vygenerujem obrázok!";
      case "video":
        return "Vytvorím ti video podľa tvojho opisu. Môžeš pridať aj obrázok!";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mode Navigation Tabs */}
      <nav className="sticky top-[73px] z-10 bg-background/95 backdrop-blur border-b px-4 py-2">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
          {(Object.keys(modeConfig) as AIMode[]).map((mode) => {
            const Icon = modeConfig[mode].icon;
            const isActive = currentMode === mode;
            return (
              <Button
                key={mode}
                variant={isActive ? "default" : "ghost"}
                onClick={() => handleModeChange(mode)}
                className={`rounded-full flex items-center gap-2 transition-all ${
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
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
