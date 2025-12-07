import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Save, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ParentSettings {
  id: string;
  password_hash: string;
  blocked_topics: string[];
  blocked_words: string[];
  safe_mode: boolean;
}

interface ParentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ParentSettings | null;
  onSettingsUpdate: () => void;
}

const ParentSettingsDialog = ({
  open,
  onOpenChange,
  settings,
  onSettingsUpdate,
}: ParentSettingsDialogProps) => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [blockedTopics, setBlockedTopics] = useState<string[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [safeMode, setSafeMode] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [newWord, setNewWord] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setBlockedTopics(settings.blocked_topics || []);
      setBlockedWords(settings.blocked_words || []);
      setSafeMode(settings.safe_mode);
    }
  }, [settings]);

  useEffect(() => {
    if (!open) {
      setIsAuthenticated(false);
      setPassword("");
    }
  }, [open]);

  const handleLogin = () => {
    if (settings && password === settings.password_hash) {
      setIsAuthenticated(true);
      toast({ title: "Úspešne prihlásený", description: "Vitaj v rodičovskom paneli!" });
    } else {
      toast({
        title: "Nesprávne heslo",
        description: "Skús to znova.",
        variant: "destructive",
      });
    }
  };

  const addTopic = () => {
    if (newTopic.trim() && !blockedTopics.includes(newTopic.trim().toLowerCase())) {
      setBlockedTopics([...blockedTopics, newTopic.trim().toLowerCase()]);
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setBlockedTopics(blockedTopics.filter((t) => t !== topic));
  };

  const addWord = () => {
    if (newWord.trim() && !blockedWords.includes(newWord.trim().toLowerCase())) {
      setBlockedWords([...blockedWords, newWord.trim().toLowerCase()]);
      setNewWord("");
    }
  };

  const removeWord = (word: string) => {
    setBlockedWords(blockedWords.filter((w) => w !== word));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        blocked_topics: blockedTopics,
        blocked_words: blockedWords,
        safe_mode: safeMode,
        updated_at: new Date().toISOString(),
      };

      if (newPassword.trim()) {
        updateData.password_hash = newPassword;
      }

      const { error } = await supabase
        .from("parental_settings")
        .update(updateData)
        .eq("id", settings.id);

      if (error) throw error;

      toast({ title: "Nastavenia uložené", description: "Zmeny boli úspešne uložené." });
      onSettingsUpdate();
      setNewPassword("");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Chyba",
        description: "Nepodarilo sa uložiť nastavenia.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="w-5 h-5 text-primary" />
            Rodičovský panel
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "Nastav zakázané témy a slová pre tvoje dieťa."
              : "Zadaj rodičovské heslo pre prístup."}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Zadaj heslo..."
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <p className="text-xs text-muted-foreground">
                Predvolené heslo: 1234
              </p>
            </div>
            <Button onClick={handleLogin} className="w-full">
              Prihlásiť sa
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Safe Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
              <div>
                <Label className="text-base font-medium">Bezpečný režim</Label>
                <p className="text-sm text-muted-foreground">
                  Zapnutý = AI je extra opatrná
                </p>
              </div>
              <Switch checked={safeMode} onCheckedChange={setSafeMode} />
            </div>

            {/* Blocked Topics */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Zakázané témy</Label>
              <div className="flex gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Pridaj tému..."
                  onKeyDown={(e) => e.key === "Enter" && addTopic()}
                />
                <Button onClick={addTopic} size="icon" variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockedTopics.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeTopic(topic)}
                  >
                    {topic}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {blockedTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground">Žiadne zakázané témy</p>
                )}
              </div>
            </div>

            {/* Blocked Words */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Zakázané slová</Label>
              <div className="flex gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Pridaj slovo..."
                  onKeyDown={(e) => e.key === "Enter" && addWord()}
                />
                <Button onClick={addWord} size="icon" variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockedWords.map((word) => (
                  <Badge
                    key={word}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeWord(word)}
                  >
                    {word}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                {blockedWords.length === 0 && (
                  <p className="text-sm text-muted-foreground">Žiadne zakázané slová</p>
                )}
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-2">
              <Label>Zmeniť heslo (voliteľné)</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nové heslo..."
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Ukladám..." : "Uložiť nastavenia"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParentSettingsDialog;
