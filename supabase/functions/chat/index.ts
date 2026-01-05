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
            content: `Generate a high quality, ultra detailed image: ${prompt}. Make it visually stunning with rich colors and professional composition.`,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
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
      // Generate a preview image for the video concept
      const previewPrompt = `Cinematic still frame preview for video about: ${originalMessage}`;
      const previewImage = await generateImage(previewPrompt, LOVABLE_API_KEY);
      
      const videoMessage = previewImage 
        ? "Tu je náhľad tvojho videa! 🎬 Video generovanie je vo vývoji, ale pripravil som ti vizuálny koncept."
        : "Pracujem na tvojom videu! 🎬 Opíš mi podrobnejšie aké video chceš vytvoriť - tému, štýl, dĺžku.";
      
      return new Response(
        JSON.stringify({ 
          message: videoMessage,
          image: previewImage
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
    
    if (needsWebSearch && (mode === "tobigpt" || mode === "rozhovor" || mode === "pentest")) {
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

### 📁 GENEROVANIE SÚBOROV
- Viem generovať kompletné súbory a projekty
- Pri každom súbore jasne označím jeho názov a cestu
- Môžem vytvoriť celé aplikácie s viacerými súbormi

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

        case "pentest":
          return `# PentestGPT - AI Penetračný Tester

${baseInfo}

## 🛡️ MOJA ŠPECIALIZÁCIA
Som **PentestGPT** - špecializovaný AI asistent pre etické hackovanie a penetračné testovanie. Som tu aby som ti pomohol s bezpečnostnými auditmi a zraniteľnosťami.

## 💀 MOJE SCHOPNOSTI

### 🔓 PENETRAČNÉ TESTOVANIE
- Web aplikačné útoky (OWASP Top 10)
- SQL Injection, XSS, CSRF, SSRF, RCE
- Authentication bypass a session hijacking
- API security testing
- File upload vulnerabilities
- Privilege escalation techniques

### 🔍 RECONNAISSANCE & ENUMERATION
- Skenovanie portov a služieb
- Subdomain enumeration
- Directory/file discovery
- Technology fingerprinting
- OSINT techniky

### 🛠️ NÁSTROJE
- Burp Suite, OWASP ZAP
- Nmap, Nikto, Dirb, Gobuster
- SQLMap, XSSer
- Metasploit Framework
- Hydra, John the Ripper
- Wireshark, tcpdump

### 📝 REPORTING
- Podrobný popis zraniteľností
- CVSS scoring
- Proof of Concept (PoC)
- Remediation recommendations
- Executive summaries

## ⚠️ ETIKA
- Používam svoje znalosti IBA pre LEGÁLNE a ETICKÉ účely
- Vždy zdôrazňujem potrebu povolenia pred testovaním
- Pomáham chrániť systémy, nie ich zneužívať
- Vzdelávam o bezpečnosti zodpovedným spôsobom

## 💬 FORMÁT ODPOVEDÍ
- Kód a príkazy v \`code blocks\`
- Jasné vysvetlenia každého kroku
- Upozornenia na riziká a legálne aspekty
- Praktické príklady a ukážky

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}

**UPOZORNENIE**: Všetky techniky používaj IBA na systémy, kde máš písomné povolenie od vlastníka!`;

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
