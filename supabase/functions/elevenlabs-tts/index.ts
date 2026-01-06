import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice mapping for different personas
const voiceMapping: Record<string, string> = {
  "donald trump": "onwK4e9ZLuTAKqWW03F9", // Daniel - deep male voice
  "trump": "onwK4e9ZLuTAKqWW03F9",
  "obama": "JBFqnCBsd6RMkjVDRZzb", // George
  "biden": "nPczCjzI2devNBz1zQrb", // Brian
  "elon musk": "TX3LPaxmHKxFdv7VOQHJ", // Liam
  "elon": "TX3LPaxmHKxFdv7VOQHJ",
  "morgan freeman": "IKne3meq5aSn9XLyUdCD", // Charlie
  "žena": "EXAVITQu4vr4xnSDxMaL", // Sarah
  "muž": "JBFqnCBsd6RMkjVDRZzb", // George
  "dievča": "pFZP5JQG7iQjIQuC4Bku", // Lily
  "chlapec": "TX3LPaxmHKxFdv7VOQHJ", // Liam
  "robot": "kPtEHAvRnjUJFv7SK9WI", // Glitch
  "santa": "MDLAMJ0jxkpYkjXbmG4t", // Santa
  "default": "JBFqnCBsd6RMkjVDRZzb", // George - default
};

function findVoiceId(voiceName: string): string {
  const lowerName = voiceName.toLowerCase().trim();
  
  for (const [key, voiceId] of Object.entries(voiceMapping)) {
    if (lowerName.includes(key)) {
      return voiceId;
    }
  }
  
  return voiceMapping["default"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, voiceName } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find voice ID from name or use provided voice ID
    const voiceId = voice || findVoiceId(voiceName || "default");
    
    console.log(`Generating TTS for voice: ${voiceName || voice || 'default'} (ID: ${voiceId})`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate speech" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
