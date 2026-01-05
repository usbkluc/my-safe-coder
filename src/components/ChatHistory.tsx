import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Trash2, Plus, Clock, Code, Image, Video, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface ChatHistoryProps {
  onSelectConversation: (id: string | null) => void;
  currentConversationId: string | null;
  currentMode: string;
}

const getModeIcon = (mode: string) => {
  switch (mode) {
    case "tobigpt":
      return Code;
    case "rozhovor":
      return MessageCircle;
    case "genob":
      return Image;
    case "video":
      return Video;
    case "pentest":
      return Shield;
    default:
      return MessageCircle;
  }
};

const ChatHistory = ({ onSelectConversation, currentConversationId, currentMode }: ChatHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const handleNewChat = () => {
    onSelectConversation(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setConversations((prev) => prev.filter((c) => c.id !== id));
      
      if (currentConversationId === id) {
        onSelectConversation(null);
      }
      
      toast({ title: "Vymazané", description: "Konverzácia bola odstránená" });
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast({ title: "Chyba", description: "Nepodarilo sa vymazať", variant: "destructive" });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Dnes";
    if (days === 1) return "Včera";
    if (days < 7) return `Pred ${days} dňami`;
    return date.toLocaleDateString("sk-SK");
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Prihlás sa pre históriu chatov</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button 
          onClick={handleNewChat}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Nový chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Načítavam...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">Žiadne konverzácie</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const Icon = getModeIcon(conv.mode);
              const isActive = currentConversationId === conv.id;
              
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.title || "Nový rozhovor"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(conv.id, e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
