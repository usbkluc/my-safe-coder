import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice mapping for different personas
const voiceMapping: Record<string, string> = {
  "donald trump": "onwK4e9ZLuTAKqWW03F9",
  "trump": "onwK4e9ZLuTAKqWW03F9",
  "obama": "JBFqnCBsd6RMkjVDRZzb",
  "biden": "nPczCjzI2devNBz1zQrb",
  "elon musk": "TX3LPaxmHKxFdv7VOQHJ",
  "elon": "TX3LPaxmHKxFdv7VOQHJ",
  "morgan freeman": "IKne3meq5aSn9XLyUdCD",
  "žena": "EXAVITQu4vr4xnSDxMaL",
  "muž": "JBFqnCBsd6RMkjVDRZzb",
  "dievča": "pFZP5JQG7iQjIQuC4Bku",
  "chlapec": "TX3LPaxmHKxFdv7VOQHJ",
  "robot": "kPtEHAvRnjUJFv7SK9WI",
  "santa": "MDLAMJ0jxkpYkjXbmG4t",
  "default": "JBFqnCBsd6RMkjVDRZzb",
};

function findVoiceId(voiceName: string): string {
  const lowerName = voiceName.toLowerCase().trim();
  for (const [key, voiceId] of Object.entries(voiceMapping)) {
    if (lowerName.includes(key)) return voiceId;
  }
  return voiceMapping["default"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { voiceName, text, format } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!text || !voiceName) {
      return new Response(
        JSON.stringify({ error: "Voice name and text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const voiceId = findVoiceId(voiceName);
    console.log(`Generating audio for: ${voiceName} (ID: ${voiceId}), format: ${format}`);

    // Generate speech audio
    const ttsResponse = await fetch(
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

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("ElevenLabs error:", ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate audio" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // Return MP3 directly
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="generated_audio.mp3"`,
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
