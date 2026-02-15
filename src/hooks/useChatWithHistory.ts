import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  isBlocked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  isGenerating?: boolean;
  generatingType?: "image" | "video";
}

interface ApiKeyInfo {
  api_key: string;
  api_endpoint: string | null;
  model_name: string | null;
  provider: string;
}

interface UseChatOptions {
  mode: "tobigpt" | "rozhovor" | "genob" | "video" | "pentest" | "voice" | "mediagen" | "riesittest";
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  activeApiKey?: ApiKeyInfo | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Image generation via edge function (uses DB keys, no Lovable gateway)
async function generateImageViaEdge(prompt: string, apiKeyInfo?: ApiKeyInfo | null): Promise<string | null> {
  try {
    const CHAT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    const requestBody: any = {
      messages: [{ role: "user", content: `Vygeneruj obrázok: ${prompt}` }],
      mode: "genob",
      imageBase64: undefined,
    };
    if (apiKeyInfo) {
      requestBody.userApiKey = apiKeyInfo.api_key;
      requestBody.userApiEndpoint = apiKeyInfo.api_endpoint;
      requestBody.userApiModel = apiKeyInfo.model_name;
      requestBody.userProvider = apiKeyInfo.provider;
    }
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.image || null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

export const useChatWithHistory = ({ mode, conversationId, onConversationCreated, activeApiKey }: UseChatOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId || !user) {
        setMessages([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        const loadedMessages: Message[] = (data || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          imageUrl: m.image_url || undefined,
        }));

        setMessages(loadedMessages);
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    };

    loadMessages();
  }, [conversationId, user]);

  const saveMessage = async (convId: string, msg: Message) => {
    if (!user) return;
    
    try {
      await supabase.from("conversation_messages").insert({
        conversation_id: convId,
        role: msg.role,
        content: msg.content,
        image_url: msg.imageUrl || null,
      });

      // Update conversation timestamp and title
      const updateData: { updated_at: string; title?: string } = {
        updated_at: new Date().toISOString(),
      };

      // Set title from first user message
      if (msg.role === "user") {
        const { data: conv } = await supabase
          .from("conversations")
          .select("title")
          .eq("id", convId)
          .single();

        if (!conv?.title) {
          updateData.title = msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "");
        }
      }

      await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", convId);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  const createConversation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          mode,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      return null;
    }
  };

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string) => {
      const userMessage: Message = { role: "user", content, imageUrl: imageBase64 };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Get or create conversation
      let convId = conversationId;
      if (!convId && user) {
        convId = await createConversation();
        if (convId) {
          onConversationCreated(convId);
        }
      }

      // Save user message if logged in
      if (convId && user) {
        await saveMessage(convId, userMessage);
      }

      try {
        const requestBody: any = {
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            mode,
            imageBase64,
          };

          // Add user's API key info if available
          if (activeApiKey) {
            requestBody.userApiKey = activeApiKey.api_key;
            requestBody.userApiEndpoint = activeApiKey.api_endpoint;
            requestBody.userApiModel = activeApiKey.model_name;
            requestBody.userProvider = activeApiKey.provider;
          }

          const response = await fetch(CHAT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify(requestBody),
          });

        // Check for JSON response (image/video generation or errors)
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          
          if (data.blocked) {
            const blockedMsg: Message = { role: "assistant", content: data.message, isBlocked: true };
            setMessages((prev) => [...prev, blockedMsg]);
            if (convId && user) await saveMessage(convId, blockedMsg);
            setIsLoading(false);
            return;
          }
          
          if (data.error) {
            const errorMsg: Message = { role: "assistant", content: `Ups! ${data.error}` };
            setMessages((prev) => [...prev, errorMsg]);
            if (convId && user) await saveMessage(convId, errorMsg);
            setIsLoading(false);
            return;
          }

          // Handle image generation - show loading state then generate
          if (data.generating === "image") {
            // Add generating message
            setMessages((prev) => [...prev, { 
              role: "assistant", 
              content: "🎨 Generujem ultra HD obrázok...", 
              isGenerating: true,
              generatingType: "image"
            }]);

            // Actually generate the image
            const imageUrl = await generateImageViaEdge(data.prompt || content, activeApiKey);
            
            // Replace generating message with result
            if (imageUrl) {
              const imgMsg: Message = { 
                role: "assistant", 
                content: "Tu je tvoj ultra HD obrázok! 🎨✨", 
                imageUrl: imageUrl 
              };
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = imgMsg;
                return newMsgs;
              });
              if (convId && user) await saveMessage(convId, imgMsg);
            } else {
              const errMsg: Message = { role: "assistant", content: "Nepodarilo sa vygenerovať obrázok. Skús to znova." };
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = errMsg;
                return newMsgs;
              });
              if (convId && user) await saveMessage(convId, errMsg);
            }
            setIsLoading(false);
            return;
          }

          // Handle video generation - show loading state
          if (data.generating === "video") {
            const vidMsg: Message = { 
              role: "assistant", 
              content: "🎬 Generujem reálne video... Toto môže trvať niekoľko sekúnd.",
              isGenerating: true,
              generatingType: "video"
            };
            setMessages((prev) => [...prev, vidMsg]);
            
            // Note: Video generation would happen here via client-side API
            // For now, show the message. Full video gen needs additional implementation
            setIsLoading(false);
            return;
          }

          // Handle already generated image response
          if (data.image) {
            const imgMsg: Message = { 
              role: "assistant", 
              content: data.message || "Tu je tvoj obrázok! 🎨", 
              imageUrl: data.image 
            };
            setMessages((prev) => [...prev, imgMsg]);
            if (convId && user) await saveMessage(convId, imgMsg);
            setIsLoading(false);
            return;
          }

          // Handle video response
          if (data.video || data.message) {
            const vidMsg: Message = { 
              role: "assistant", 
              content: data.message || "Tu je tvoje video! 🎬",
              videoUrl: data.video 
            };
            setMessages((prev) => [...prev, vidMsg]);
            if (convId && user) await saveMessage(convId, vidMsg);
            setIsLoading(false);
            return;
          }
        }

        if (!response.ok || !response.body) {
          throw new Error("Failed to get response");
        }

        // Stream the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        let textBuffer = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage?.role === "assistant") {
                    lastMessage.content = assistantContent;
                  }
                  return newMessages;
                });
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Save assistant message
        if (convId && user && assistantContent) {
          await saveMessage(convId, { role: "assistant", content: assistantContent });
        }
      } catch (error) {
        console.error("Chat error:", error);
        const errMsg: Message = { role: "assistant", content: "Ups! Niečo sa pokazilo. Skús to znova. 🙈" };
        setMessages((prev) => [...prev, errMsg]);
        if (convId && user) await saveMessage(convId, errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, mode, conversationId, user, onConversationCreated, activeApiKey]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};