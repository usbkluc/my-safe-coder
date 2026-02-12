import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKey {
  id: string;
  provider: string;
  provider_name: string;
  api_key: string;
  api_endpoint: string | null;
  model_name: string | null;
  is_active: boolean;
  daily_limit: number;
  monthly_limit: number;
  allowed_modes: string[];
}

export const useApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      loadKeys();
      checkAdmin();
    } else {
      setApiKeys([]);
      setSelectedKeyId(null);
      setIsAdmin(false);
    }
  }, [user]);

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
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const keys = (data as ApiKey[]) || [];
    setApiKeys(keys);

    // Auto-select first key if none selected
    if (!selectedKeyId && keys.length > 0) {
      setSelectedKeyId(keys[0].id);
    }
  };

  const getActiveKey = (mode: string): ApiKey | null => {
    if (selectedKeyId) {
      const key = apiKeys.find(
        (k) => k.id === selectedKeyId && k.is_active && k.allowed_modes?.includes(mode)
      );
      if (key) return key;
    }
    // Fallback to first key that supports this mode
    return apiKeys.find((k) => k.is_active && k.allowed_modes?.includes(mode)) || null;
  };

  return {
    apiKeys,
    selectedKeyId,
    setSelectedKeyId,
    getActiveKey,
    isAdmin,
    refreshKeys: loadKeys,
  };
};
