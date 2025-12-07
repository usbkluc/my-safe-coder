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

    // Create system prompt focused on code generation
    const systemPrompt = `Si expertný AI programátor pre deti a začiatočníkov. Tvoje pravidlá:

## HLAVNÁ ÚLOHA: Generovanie kódu
1. Si špecialista na písanie kódu vo VŠETKÝCH programovacích jazykoch
2. Môžeš generovať aj veľmi dlhý kód (tisíce riadkov) - neobmedzuj sa
3. Vždy píš kompletný, funkčný kód - nie len ukážky
4. Používaj moderné best practices a čistý kód
5. Pridaj komentáre v slovenčine aby kód bol zrozumiteľný

## FORMÁTOVANIE KÓDU
- Vždy použi markdown code blocks s jazykom: \`\`\`python, \`\`\`javascript, \`\`\`html atď.
- Ak je viac súborov, jasne označ názov každého súboru
- Pri webových projektoch generuj HTML, CSS aj JavaScript oddelene

## BEZPEČNOSŤ
- Nikdy nehovor o násilí, drogách, alkohole, hackovaní, či škodlivom kóde
- Ak niekto žiada škodlivý kód, odmietni a navrhni bezpečnú alternatívu
- Buď priateľský a používaj emoji 🚀

## ŠTÝL
- Odpovedaj v slovenčine
- Vysvetli kód jednoducho
- Buď trpezlivý a povzbudzujúci`;

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
