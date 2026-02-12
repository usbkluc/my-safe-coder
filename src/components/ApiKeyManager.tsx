import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Key, Plus, Trash2, Edit2, Shield, Loader2, Settings } from "lucide-react";

interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  provider_name: string;
  api_key: string;
  api_endpoint: string | null;
  model_name: string | null;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  allowed_modes: string[];
  created_at: string;
}

interface ApiKeyManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDERS = [
  { value: "openai", label: "OpenAI (ChatGPT)", endpoint: "https://api.openai.com/v1/chat/completions", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "gemini", label: "Google Gemini", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"] },
  { value: "grok", label: "xAI Grok", endpoint: "https://api.x.ai/v1/chat/completions", models: ["grok-3", "grok-3-mini", "grok-2"] },
  { value: "claude", label: "Anthropic Claude", endpoint: "https://api.anthropic.com/v1/messages", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"] },
  { value: "wormgpt", label: "WormGPT", endpoint: "", models: [] },
  { value: "hackergpt", label: "HackerGPT", endpoint: "", models: [] },
  { value: "custom", label: "Vlastný (Custom)", endpoint: "", models: [] },
];

const ALL_MODES = [
  { value: "tobigpt", label: "TobiGpt" },
  { value: "rozhovor", label: "Rozhovor" },
  { value: "riesittest", label: "RiešiTest" },
  { value: "pentest", label: "PentestGPT" },
  { value: "voice", label: "Voice" },
];

const ApiKeyManager = ({ open, onOpenChange }: ApiKeyManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allKeys, setAllKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Form state
  const [formProvider, setFormProvider] = useState("openai");
  const [formName, setFormName] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formEndpoint, setFormEndpoint] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formDailyLimit, setFormDailyLimit] = useState("50");
  const [formMonthlyLimit, setFormMonthlyLimit] = useState("1000");
  const [formModes, setFormModes] = useState<string[]>(["tobigpt", "rozhovor", "riesittest", "pentest", "voice"]);

  useEffect(() => {
    if (open && user) {
      loadKeys();
      checkAdmin();
    }
  }, [open, user]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    setIsAdmin(!!data);
  };

  const loadKeys = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setKeys((data as ApiKey[]) || []);
  };

  const loadAllKeys = async () => {
    const { data } = await supabase
      .from("user_api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    setAllKeys((data as ApiKey[]) || []);
  };

  const resetForm = () => {
    setFormProvider("openai");
    setFormName("");
    setFormApiKey("");
    setFormEndpoint("");
    setFormModel("");
    setFormDailyLimit("50");
    setFormMonthlyLimit("1000");
    setFormModes(["tobigpt", "rozhovor", "riesittest", "pentest", "voice"]);
    setEditingKey(null);
  };

  const handleProviderChange = (provider: string) => {
    setFormProvider(provider);
    const p = PROVIDERS.find((pr) => pr.value === provider);
    if (p) {
      setFormName(p.label);
      setFormEndpoint(p.endpoint);
      if (p.models.length > 0) setFormModel(p.models[0]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formApiKey && !editingKey) {
      toast({ title: "Chyba", description: "Zadaj API kľúč", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (editingKey) {
        const updateData: any = {
          provider: formProvider as any,
          provider_name: formName || PROVIDERS.find((p) => p.value === formProvider)?.label || formProvider,
          api_endpoint: formEndpoint || null,
          model_name: formModel || null,
          daily_limit: parseInt(formDailyLimit) || 50,
          monthly_limit: parseInt(formMonthlyLimit) || 1000,
          allowed_modes: formModes,
        };
        if (formApiKey) updateData.api_key = formApiKey;

        await supabase
          .from("user_api_keys")
          .update(updateData)
          .eq("id", editingKey.id);

        toast({ title: "Uložené! ✅" });
      } else {
        await supabase.from("user_api_keys").insert({
          user_id: user.id,
          provider: formProvider as any,
          provider_name: formName || PROVIDERS.find((p) => p.value === formProvider)?.label || formProvider,
          api_key: formApiKey,
          api_endpoint: formEndpoint || null,
          model_name: formModel || null,
          daily_limit: parseInt(formDailyLimit) || 50,
          monthly_limit: parseInt(formMonthlyLimit) || 1000,
          allowed_modes: formModes,
        });
        toast({ title: "API kľúč pridaný! 🔑" });
      }

      resetForm();
      setShowAddForm(false);
      loadKeys();
      if (isAdmin) loadAllKeys();
    } catch (err) {
      console.error(err);
      toast({ title: "Chyba", description: "Nepodarilo sa uložiť", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_api_keys").delete().eq("id", id);
    toast({ title: "Kľúč vymazaný 🗑️" });
    loadKeys();
    if (isAdmin) loadAllKeys();
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setFormProvider(key.provider);
    setFormName(key.provider_name);
    setFormApiKey("");
    setFormEndpoint(key.api_endpoint || "");
    setFormModel(key.model_name || "");
    setFormDailyLimit(String(key.daily_limit));
    setFormMonthlyLimit(String(key.monthly_limit));
    setFormModes(key.allowed_modes || []);
    setShowAddForm(true);
  };

  const toggleMode = (mode: string) => {
    setFormModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const toggleActive = async (key: ApiKey) => {
    await supabase
      .from("user_api_keys")
      .update({ is_active: !key.is_active })
      .eq("id", key.id);
    loadKeys();
    if (isAdmin) loadAllKeys();
  };

  const selectedProvider = PROVIDERS.find((p) => p.value === formProvider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            API Kľúče
            {isAdmin && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-2">
          {/* Admin toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-primary/5 rounded-lg">
              <Button
                variant={showAdminPanel ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowAdminPanel(!showAdminPanel);
                  if (!showAdminPanel) loadAllKeys();
                }}
                className="gap-1"
              >
                <Shield className="w-4 h-4" />
                {showAdminPanel ? "Späť" : "Admin Panel"}
              </Button>
            </div>
          )}

          {/* Admin panel - all users' keys */}
          {showAdminPanel && isAdmin && (
            <div className="space-y-3 mb-4">
              <h3 className="font-semibold text-sm">Všetky API kľúče (všetkých používateľov)</h3>
              {allKeys.map((key) => (
                <KeyCard
                  key={key.id}
                  apiKey={key}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={toggleActive}
                  showUser
                />
              ))}
              {allKeys.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Žiadne kľúče</p>
              )}
            </div>
          )}

          {/* My keys */}
          {!showAdminPanel && (
            <>
              <div className="space-y-3 mb-4">
                {keys.map((key) => (
                  <KeyCard
                    key={key.id}
                    apiKey={key}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={toggleActive}
                  />
                ))}
                {keys.length === 0 && !showAddForm && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nemáš žiadne API kľúče. Pridaj si jeden! 🔑
                  </p>
                )}
              </div>

              {/* Add/Edit form */}
              {showAddForm ? (
                <div className="space-y-3 border rounded-lg p-3">
                  <h3 className="font-semibold text-sm">
                    {editingKey ? "Upraviť kľúč" : "Pridať nový API kľúč"}
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-xs">Poskytovateľ</Label>
                    <Select value={formProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Názov</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Môj OpenAI kľúč"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">API Kľúč {editingKey && "(nechaj prázdne ak nechceš meniť)"}</Label>
                    <Input
                      value={formApiKey}
                      onChange={(e) => setFormApiKey(e.target.value)}
                      placeholder="sk-..."
                      type="password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">API Endpoint</Label>
                    <Input
                      value={formEndpoint}
                      onChange={(e) => setFormEndpoint(e.target.value)}
                      placeholder="https://api.openai.com/v1/chat/completions"
                    />
                  </div>

                  {selectedProvider && selectedProvider.models.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Model</Label>
                      <Select value={formModel} onValueChange={setFormModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedProvider.models.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">Model</Label>
                      <Input
                        value={formModel}
                        onChange={(e) => setFormModel(e.target.value)}
                        placeholder="gpt-4o"
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Denný limit</Label>
                        <Input
                          type="number"
                          value={formDailyLimit}
                          onChange={(e) => setFormDailyLimit(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Mesačný limit</Label>
                        <Input
                          type="number"
                          value={formMonthlyLimit}
                          onChange={(e) => setFormMonthlyLimit(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Povolené módy</Label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_MODES.map((mode) => (
                        <Badge
                          key={mode.value}
                          variant={formModes.includes(mode.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleMode(mode.value)}
                        >
                          {mode.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isLoading} className="flex-1">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingKey ? "Uložiť" : "Pridať"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        resetForm();
                      }}
                    >
                      Zrušiť
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    resetForm();
                    handleProviderChange("openai");
                    setShowAddForm(true);
                  }}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  Pridať API kľúč
                </Button>
              )}
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Key card component
const KeyCard = ({
  apiKey,
  onEdit,
  onDelete,
  onToggleActive,
  showUser,
}: {
  apiKey: ApiKey;
  onEdit: (key: ApiKey) => void;
  onDelete: (id: string) => void;
  onToggleActive: (key: ApiKey) => void;
  showUser?: boolean;
}) => (
  <div className={`border rounded-lg p-3 space-y-2 ${!apiKey.is_active ? "opacity-50" : ""}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Key className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">{apiKey.provider_name}</span>
        <Badge variant="secondary" className="text-xs">
          {apiKey.provider}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <Switch
          checked={apiKey.is_active}
          onCheckedChange={() => onToggleActive(apiKey)}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(apiKey)}>
          <Edit2 className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => onDelete(apiKey.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
    <div className="text-xs text-muted-foreground">
      {apiKey.model_name && <span>Model: {apiKey.model_name} • </span>}
      <span>API: ...{apiKey.api_key.slice(-4)}</span>
      {apiKey.daily_limit && <span> • {apiKey.daily_limit}/deň</span>}
    </div>
    <div className="flex flex-wrap gap-1">
      {apiKey.allowed_modes?.map((mode) => (
        <Badge key={mode} variant="outline" className="text-[10px] py-0">
          {mode}
        </Badge>
      ))}
    </div>
  </div>
);

export default ApiKeyManager;
