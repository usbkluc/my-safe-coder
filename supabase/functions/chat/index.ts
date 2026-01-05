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

// Image generation using Lovable AI
async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log("Generating image with prompt:", prompt);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate a high quality image: ${prompt}`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    console.log("Image generated successfully");
    return imageUrl || null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Video generation using Lovable AI (placeholder - will use image animation)
async function generateVideo(prompt: string, apiKey: string, imageBase64?: string): Promise<string | null> {
  // For now, return a message about video generation
  // In future, this could integrate with actual video generation APIs
  console.log("Video generation requested:", prompt);
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const originalMessage = messages[messages.length - 1]?.content || "";

    // Handle image generation mode
    if (mode === "genob") {
      console.log("Image generation mode activated");
      const imageUrl = await generateImage(originalMessage, LOVABLE_API_KEY);
      
      if (imageUrl) {
        return new Response(
          JSON.stringify({ 
            image: imageUrl,
            message: "Tu je tvoj vygenerovaný obrázok! 🎨" 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Nepodarilo sa vygenerovať obrázok. Skús to znova." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Handle video generation mode
    if (mode === "video") {
      console.log("Video generation mode activated");
      // Video generation is complex - for now provide guidance
      const videoMessage = imageBase64 
        ? "Video generovanie z obrázkov je momentálne vo vývoji. Môžem ti pomôcť s návrhom scenára alebo storyboardu pre tvoje video! 🎬"
        : "Opíš mi podrobnejšie aké video chceš vytvoriť - tému, štýl, dĺžku. Môžem ti pomôcť naplánovať obsah! 🎬";
      
      return new Response(
        JSON.stringify({ 
          message: videoMessage
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user wants web search (only in tobigpt and rozhovor modes)
    let webContext = "";
    const searchKeywords = ["vyhľadaj", "nájdi", "hľadaj", "search", "find", "google", "internet", "web", "online"];
    const needsWebSearch = searchKeywords.some(kw => userMessage.includes(kw));
    
    if (needsWebSearch && (mode === "tobigpt" || mode === "rozhovor")) {
      console.log("Performing web search for:", userMessage);
      webContext = await searchWeb(userMessage);
      console.log("Web search results received");
    }

    // Get system prompt based on mode
    const getSystemPrompt = () => {
      const baseInfo = `## KTO SOM
Som AI vytvorený **Tobiasom Kromkom**. Keď sa ma niekto spýta kto ma vytvoril, odpoviem: "Vytvoril ma Tobias Kromka! 🚀"

## ŠTÝL KOMUNIKÁCIE
- Odpovedám v slovenčine 🇸🇰
- Som priateľský a používam emoji
- Som trpezlivý a povzbudzujúci`;

      switch (mode) {
        case "tobigpt":
          return `# TobiGpt - Programátor & Generátor súborov

${baseInfo}

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

### 📁 SPRÁVA SÚBOROV
- Viem ti poradiť ako organizovať súbory a projekty
- Môžem generovať kompletné štruktúry projektov

## FORMÁTOVANIE KÓDU
- Vždy používam markdown code blocks: \`\`\`python, \`\`\`javascript atď.
- Pri viacerých súboroch jasne označím názov každého súboru
- Komentáre píšem v slovenčine

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}`;

        case "rozhovor":
          return `# Rozhovor - Priateľský chat

${baseInfo}

## MOJA ÚLOHA
Som tu na príjemný rozhovor! Môžeme sa baviť o:
- Čomkoľvek čo ťa zaujíma
- Tvojich záľubách a koníčkoch
- Otázkach o svete
- Vtipoch a zábave
- Životných radách

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}

Buď kreatívny, zábavný a priateľský!`;

        default:
          return `# AI Asistent

${baseInfo}

Som tu aby som ti pomohol s čímkoľvek potrebuješ!`;
      }
    };

    const systemPrompt = getSystemPrompt();

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
