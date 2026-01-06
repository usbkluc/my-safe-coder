import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Download, Play, Film, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaGenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const voiceOptions = [
  { id: "donald trump", label: "Donald Trump" },
  { id: "elon musk", label: "Elon Musk" },
  { id: "morgan freeman", label: "Morgan Freeman" },
  { id: "žena", label: "Žena" },
  { id: "muž", label: "Muž" },
  { id: "robot", label: "Robot" },
  { id: "santa", label: "Santa Claus" },
];

const MediaGenDialog = ({ open, onOpenChange }: MediaGenDialogProps) => {
  const { toast } = useToast();
  const [format, setFormat] = useState<"mp3" | "video">("mp3");
  const [voiceName, setVoiceName] = useState("donald trump");
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ title: "Chyba", description: "Napíš text, ktorý má byť povedaný", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setGeneratedUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-with-voice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            voiceName,
            text,
            format,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedUrl(url);
      setStep(3);
      toast({ title: "Hotovo! 🎉", description: `Tvoje ${format === "mp3" ? "MP3" : "video"} je pripravené!` });
    } catch (error) {
      console.error("Generation error:", error);
      toast({ 
        title: "Chyba", 
        description: error instanceof Error ? error.message : "Nepodarilo sa vygenerovať", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedUrl) {
      const a = document.createElement("a");
      a.href = generatedUrl;
      a.download = `generated_${voiceName.replace(/\s/g, "_")}.${format === "mp3" ? "mp3" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setFormat("mp3");
    setVoiceName("donald trump");
    setText("");
    setGeneratedUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetDialog(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {format === "mp3" ? <Music className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            MediaGen - Generátor s Hlasom
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Vyber formát</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as "mp3" | "video")} className="mt-3">
                <div className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="mp3" id="mp3" />
                  <Label htmlFor="mp3" className="flex items-center gap-2 cursor-pointer">
                    <Music className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="font-medium">MP3 Audio</p>
                      <p className="text-sm text-muted-foreground">Vygeneruje hlasovú nahrávku</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-muted/50 cursor-pointer opacity-50">
                  <RadioGroupItem value="video" id="video" disabled />
                  <Label htmlFor="video" className="flex items-center gap-2 cursor-not-allowed">
                    <Film className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Video (Čoskoro)</p>
                      <p className="text-sm text-muted-foreground">Video s hlasom - pripravujeme</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Pokračovať
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Vyber hlas</Label>
              <RadioGroup value={voiceName} onValueChange={setVoiceName} className="mt-3 grid grid-cols-2 gap-2">
                {voiceOptions.map((voice) => (
                  <div key={voice.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value={voice.id} id={voice.id} />
                    <Label htmlFor={voice.id} className="cursor-pointer text-sm">{voice.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="text" className="text-base font-medium">Čo má povedať?</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Napíš text, ktorý má byť povedaný..."
                className="mt-2 min-h-[100px]"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Späť
              </Button>
              <Button onClick={handleGenerate} disabled={isLoading || !text.trim()} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generujem...
                  </>
                ) : (
                  "Generovať 🎬"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && generatedUrl && (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <p className="text-green-600 font-medium mb-2">✅ Úspešne vygenerované!</p>
              <p className="text-sm text-muted-foreground">Hlas: {voiceName}</p>
            </div>

            <div className="space-y-3">
              <audio controls className="w-full" src={generatedUrl}>
                Your browser does not support the audio element.
              </audio>

              <Button onClick={handleDownload} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Stiahnuť {format.toUpperCase()}
              </Button>
            </div>

            <Button variant="outline" onClick={resetDialog} className="w-full">
              Vytvoriť ďalšie
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaGenDialog;
