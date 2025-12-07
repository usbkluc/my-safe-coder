import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isBlocked?: boolean;
}

const ChatMessage = ({ role, content, isBlocked }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 items-start",
        role === "user" ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {role === "user" ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      <div
        className={cn(
          "chat-bubble",
          role === "user" ? "chat-bubble-user" : "chat-bubble-assistant",
          isBlocked && "border-destructive/50 bg-destructive/5"
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
