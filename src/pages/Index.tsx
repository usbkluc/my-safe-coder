import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Trash2, Sparkles, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SafeModeIndicator from "@/components/SafeModeIndicator";
import ParentSettingsDialog from "@/components/ParentSettingsDialog";
import { useChat } from "@/hooks/useChat";

interface ParentalSettings {
  id: string;
  password_hash: string;
  blocked_topics: string[];
  blocked_words: string[];
  safe_mode: boolean;
}

const Index = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ParentalSettings | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearMessages } = useChat({
    blockedTopics: settings?.blocked_topics || [],
    blockedWords: settings?.blocked_words || [],
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("parental_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleClearChat = () => {
    clearMessages();
    toast({ title: "Chat vymazaný", description: "Nový rozhovor začína!" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float">
              <Bot className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                AI Programátor Ultimate
                <Sparkles className="w-5 h-5 text-accent" />
              </h1>
              <p className="text-xs text-muted-foreground">Vytvoril Tobias Kromka</p>
              <SafeModeIndicator isActive={settings?.safe_mode ?? true} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
        <ScrollArea className="flex-1 py-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 animate-bounce">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Ahoj! Som AI Programátor Ultimate 🚀</h2>
              <p className="text-muted-foreground max-w-md">
                Viem písať kód v akomkoľvek jazyku, vyhľadávať na internete, a generovať
                projekty s miliónmi riadkov! Vytvoril ma Tobias Kromka.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                {[
                  "Vytvor hru had v Pythone 🐍",
                  "Vyhľadaj najnovšie AI novinky 🌐",
                  "Vytvor webstránku s CSS animáciami ✨",
                  "Kto ťa vytvoril? 🤔",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
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
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-secondary-foreground" />
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
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </main>

      {/* Parent Settings Dialog */}
      <ParentSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsUpdate={fetchSettings}
      />
    </div>
  );
};

export default Index;
