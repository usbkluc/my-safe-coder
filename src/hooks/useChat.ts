import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  isBlocked?: boolean;
}

interface UseChatOptions {
  blockedTopics: string[];
  blockedWords: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = ({ blockedTopics, blockedWords }: UseChatOptions) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: "user", content };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            blockedTopics,
            blockedWords,
          }),
        });

        // Check for blocked content or errors
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          
          if (data.blocked) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: data.message, isBlocked: true },
            ]);
            setIsLoading(false);
            return;
          }
          
          if (data.error) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Ups! ${data.error}` },
            ]);
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
              // Incomplete JSON, put it back
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Ups! Niečo sa pokazilo. Skús to znova. 🙈" },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, blockedTopics, blockedWords]
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
