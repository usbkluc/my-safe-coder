import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ImagePlus, X } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  mode?: "tobigpt" | "rozhovor" | "genob" | "video";
  allowImage?: boolean;
}

const ChatInput = ({ onSend, isLoading, disabled, mode, allowImage }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim(), imagePreview || undefined);
      setInput("");
      setImagePreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getPlaceholder = () => {
    switch (mode) {
      case "tobigpt":
        return "Opíš aký kód chceš vygenerovať... 💻";
      case "rozhovor":
        return "Napíš svoju správu... 💬";
      case "genob":
        return "Opíš obrázok, ktorý chceš vygenerovať... 🎨";
      case "video":
        return "Opíš video, ktoré chceš vytvoriť... 🎬";
      default:
        return "Napíš svoju otázku... 💭";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {imagePreview && (
        <div className="relative inline-block w-24 h-24">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="w-24 h-24 object-cover rounded-xl border-2 border-primary/30"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
            onClick={removeImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
      <div className="flex gap-3 items-end">
        {allowImage && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-14 w-14 rounded-2xl border-2 border-primary/20"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <ImagePlus className="w-5 h-5" />
            </Button>
          </>
        )}
        <div className="flex-1 relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="min-h-[56px] max-h-32 resize-none rounded-2xl border-2 border-primary/20 focus:border-primary bg-card pr-4 text-base"
            disabled={isLoading || disabled}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!input.trim() || isLoading || disabled}
          className="h-14 w-14 rounded-2xl floating-button bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
