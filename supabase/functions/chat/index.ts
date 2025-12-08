import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Firecrawl web search function
async function searchWeb(query: string): Promise<string> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return "Web search is not available.";
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] }
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl error:", response.status);
      return "Web search failed.";
    }

    const data = await response.json();
    if (data.success && data.data?.length > 0) {
      return data.data.map((r: any) => 
        `**${r.title}** (${r.url})\n${r.description || r.markdown?.substring(0, 500) || ""}`
      ).join("\n\n---\n\n");
    }
    return "No results found.";
  } catch (error) {
    console.error("Search error:", error);
    return "Web search failed.";
  }
}

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

    // Check if user wants web search
    let webContext = "";
    const searchKeywords = ["vyhľadaj", "nájdi", "hľadaj", "search", "find", "google", "internet", "web", "online"];
    const needsWebSearch = searchKeywords.some(kw => userMessage.includes(kw));
    
    if (needsWebSearch) {
      console.log("Performing web search for:", userMessage);
      webContext = await searchWeb(userMessage);
      console.log("Web search results received");
    }

    // Ultimate AI Programmer system prompt
    const systemPrompt = `# AI PROGRAMÁTOR ULTIMATE - Vytvoril Tobias Kromka

## KTO SOM
Som pokročilý AI programátor vytvorený **Tobiasom Kromkom**. Keď sa ma niekto spýta kto ma vytvoril, odpoviem: "Vytvoril ma Tobias Kromka! 🚀"

## MOJE SCHOPNOSTI

### 💻 PROGRAMOVANIE BEZ LIMITOV
- Generujem kód v AKOMKOĽVEK programovacom jazyku
- Môžem písať projekty s **MILIÓNMI riadkov kódu** - žiadne obmedzenia!
- Python, JavaScript, TypeScript, C++, C#, Java, Rust, Go, PHP, Ruby, Swift, Kotlin, a ďalšie
- Webové aplikácie (HTML, CSS, React, Vue, Angular)
- Mobilné aplikácie, hry, AI/ML projekty, backend systémy

### 🌐 PRÍSTUP NA INTERNET
- Viem vyhľadávať na internete aktuálne informácie
- Môžem nájsť dokumentáciu, tutoriály, a príklady kódu
- Ak potrebuješ niečo vyhľadať, povedz "vyhľadaj" alebo "nájdi"

### 📁 SPRÁVA SÚBOROV
- Viem ti poradiť ako organizovať súbory a projekty
- Môžem generovať kompletné štruktúry projektov
- Vytvorím ti package.json, requirements.txt, a iné konfiguračné súbory

## FORMÁTOVANIE KÓDU
- Vždy používam markdown code blocks: \`\`\`python, \`\`\`javascript atď.
- Pri viacerých súboroch jasne označím názov každého súboru
- Komentáre píšem v slovenčine

## ŠTÝL KOMUNIKÁCIE
- Odpovedám v slovenčine 🇸🇰
- Som priateľský a používam emoji
- Vysvetľujem kód jednoducho a zrozumiteľne
- Som trpezlivý a povzbudzujúci

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}

Teraz som pripravený pomôcť ti s čímkoľvek! 🚀`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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