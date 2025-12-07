import { cn } from "@/lib/utils";
import { Bot, User, Copy, Download, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isBlocked?: boolean;
}

const ChatMessage = ({ role, content, isBlocked }: ChatMessageProps) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Extract code blocks from content
  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string; start: number; end: number }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || "text",
        code: match[2].trim(),
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return blocks;
  };

  const codeBlocks = role === "assistant" ? extractCodeBlocks(content) : [];

  const copyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast({ title: "Skopírované!", description: "Kód bol skopírovaný do schránky" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadCode = (code: string, language: string, index: number) => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      sql: "sql",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      markdown: "md",
      bash: "sh",
      shell: "sh",
      text: "txt",
    };

    const ext = extensions[language.toLowerCase()] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-${index + 1}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Stiahnuté!", description: `Súbor code-${index + 1}.${ext} bol stiahnutý` });
  };

  const renderContent = () => {
    if (role === "user" || codeBlocks.length === 0) {
      return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
    }

    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    codeBlocks.forEach((block, index) => {
      // Add text before code block
      if (block.start > lastEnd) {
        const textBefore = content.slice(lastEnd, block.start);
        if (textBefore.trim()) {
          parts.push(
            <p key={`text-${index}`} className="whitespace-pre-wrap leading-relaxed mb-3">
              {textBefore.trim()}
            </p>
          );
        }
      }

      // Add code block with actions
      parts.push(
        <div key={`code-${index}`} className="my-3 rounded-xl overflow-hidden border border-border/50">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {block.language}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => copyCode(block.code, index)}
              >
                {copiedIndex === index ? (
                  <Check className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copiedIndex === index ? "Hotovo" : "Kopírovať"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => downloadCode(block.code, block.language, index)}
              >
                <Download className="w-3 h-3 mr-1" />
                Stiahnuť
              </Button>
            </div>
          </div>
          <pre className="p-4 overflow-x-auto bg-foreground/5 text-sm">
            <code className="font-mono">{block.code}</code>
          </pre>
        </div>
      );

      lastEnd = block.end;
    });

    // Add remaining text after last code block
    if (lastEnd < content.length) {
      const textAfter = content.slice(lastEnd);
      if (textAfter.trim()) {
        parts.push(
          <p key="text-end" className="whitespace-pre-wrap leading-relaxed mt-3">
            {textAfter.trim()}
          </p>
        );
      }
    }

    return <>{parts}</>;
  };

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
          isBlocked && "border-destructive/50 bg-destructive/5",
          role === "assistant" && codeBlocks.length > 0 && "max-w-[95%]"
        )}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default ChatMessage;
