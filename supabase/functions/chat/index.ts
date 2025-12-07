import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, blockedTopics, blockedWords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check if user message contains blocked content
    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    
    const blockedTopicFound = blockedTopics?.find((topic: string) => 
      userMessage.includes(topic.toLowerCase())
    );
    
    const blockedWordFound = blockedWords?.find((word: string) => 
      userMessage.includes(word.toLowerCase())
    );

    if (blockedTopicFound || blockedWordFound) {
      console.log("Blocked content detected:", blockedTopicFound || blockedWordFound);
      return new Response(
        JSON.stringify({ 
          blocked: true, 
          message: "Prepáč, ale o tejto téme sa nemôžem rozprávať. Skús sa ma opýtať niečo iné! 🌈" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create safe system prompt for children
    const systemPrompt = `Si priateľský AI asistent pre deti. Tvoje pravidlá:
1. Vždy buď milý, trpezlivý a povzbudzujúci
2. Používaj jednoduchý jazyk vhodný pre deti
3. Nikdy nehovor o násilí, drogách, alkohole, či nevhodnom obsahu
4. Ak sa niekto pýta na niečo nevhodné, jemne odmietni a navrhni inú tému
5. Používaj emoji aby si bol priateľský 🌟
6. Pomáhaj s úlohami, vysvetľuj veci jednoducho
7. Ak píšeš kód, vysvetli ho jednoducho a použi maximálne potrebný počet riadkov
8. Odpovedaj v slovenčine`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Príliš veľa požiadaviek. Skús to znova o chvíľu." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Služba je momentálne nedostupná." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Niečo sa pokazilo. Skús to znova." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
