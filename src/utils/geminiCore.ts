/**
 * ScrapSetu Shared Gemini Vision Classification Core
 * Pure, environment-agnostic REST implementation that works in:
 * - Cloudflare Workers / Cloudflare Pages Functions
 * - Web Browsers (direct client fallback)
 * - Node.js Express server
 */

export const VALID_CATEGORIES = [
  'Plastic',
  'Glass',
  'Paper/Cardboard',
  'Metal',
  'PCBs & Circuit Boards',
  'Lithium-ion & Batteries',
  'Copper Wire & Motors',
  'Smartphones & Tablets',
  'Laptops & Computers',
  'Displays & CRT Monitors',
  'Large White Goods & ACs',
  'Small Home Appliances',
  'Fluorescent & LED Lighting',
  'Solar PV Panels & Inverters',
  'E-waste',
  'Textile',
  'Rubber',
  'Organic',
  'Mixed/Other',
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

export interface GeminiClassificationResult {
  success: boolean;
  source: string;
  category: ValidCategory;
  confidence: number;
  detectedItemName: string;
  detectedItemNameHi: string;
  secondaryCategory: string;
  secondaryConfidence: number;
  isUncertain: boolean;
  estimatedWeightKg: number;
  cleanliness: 'clean' | 'dirty';
  structural: 'intact' | 'damaged';
  materials: string[];
  hazardousElements: string[];
  safetyGuidanceEn: string;
  safetyGuidanceHi: string;
}

const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

const CLASSIFICATION_PROMPT = `
You are an expert waste classification and recycling inspector for ScrapSetu in India.
Inspect the provided image of scrap / recyclable / e-waste material carefully and classify it into the most accurate waste category.

Categories to choose from (choose EXACTLY ONE):
- "Plastic": PET bottles (water, soda), HDPE jugs (milk, oil), plastic buckets, crates, PVC pipes, plastic packaging, wrappers, plastic chairs/containers.
- "Glass": Glass bottles (beer, soda, wine, liquor), food/pickle jars, cullet, broken glass, window pane pieces.
- "Paper/Cardboard": Corrugated cardboard cartons/boxes, newspaper raddi, books, notebooks, shredded paper, office paperwork, paper bags.
- "Metal": Scrap iron, steel rods, sheet metal, iron mesh, steel utensils, tin cans, aluminum beverage cans, brass, bronze (structural/scrap metal).
- "PCBs & Circuit Boards": Printed circuit boards (PCBs), computer motherboards, RAM modules, green/blue electronics boards with soldered microchips, ICs, transistors, telecom cards.
- "Lithium-ion & Batteries": Lithium-ion battery packs, smartphone batteries, laptop battery modules, 18650 cylindrical cells, lead-acid inverter/car batteries, dry cells.
- "Copper Wire & Motors": Insulated copper cables, stripped bright copper wire, electric motor stators/windings (from ceiling fans, water pumps, coolers), transformers.
- "Smartphones & Tablets": Mobile phones, smartphones (Android/iPhone), keypad feature phones, damaged tablets, iPads.
- "Laptops & Computers": Laptops, notebooks, desktop CPU cabinets, internal hard disk drives (HDD/SSD), computer keyboards, mice.
- "Displays & CRT Monitors": Computer monitors, LCD/LED display panels, TVs, CRT glass picture tubes.
- "Large White Goods & ACs": Refrigerators, AC units, compressors, washing machines, microwaves.
- "Small Home Appliances": Kitchen mixer grinders, electric irons, blenders, electric kettles, toasters, hair dryers, table/exhaust fans.
- "Fluorescent & LED Lighting": Fluorescent tubelights, CFL spiral bulbs, mercury vapor lamps, LED bulbs and drivers.
- "Solar PV Panels & Inverters": Solar photovoltaic modules/panels, solar inverters, solar charge controllers.
- "E-waste": General mixed consumer electronics, power adapters, phone chargers, remote controls, routers, cables with plugs, earphones.
- "Textile": Old clothes, fabrics, garments, cloth bags, rags.
- "Rubber": Rubber tyres, inner tubes, rubber belts, footwear soles.
- "Organic": Food scraps, fruit peels, vegetable waste, garden leaves.
- "Mixed/Other": Unsorted mixed materials that do not belong to a single category above.

Guidelines:
- Focus on the primary scrap item shown in the image.
- Electronic devices (laptops, phones, kitchen appliances, circuit boards, batteries, copper wiring) must be categorized under their specific electronic/appliance category, NOT under generic plastic or metal.
- Plastic bottles and containers belong in "Plastic". Glass bottles belong in "Glass". Boxes belong in "Paper/Cardboard".

Return ONLY a JSON object with:
1. "category": EXACT category string from the list above.
2. "confidence": number between 0.0 and 1.0.
3. "detectedItemName": Specific identified item name in English (e.g. "Dell Laptop with Broken Screen" or "PET Plastic Water Bottles").
4. "detectedItemNameHi": Specific identified item name in Hindi (e.g. "लैपटॉप" or "प्लास्टिक की बोतलें").
5. "secondaryCategory": Next most plausible category.
6. "secondaryConfidence": number between 0.0 and 1.0.
7. "isUncertain": boolean (true if image is blurry, ambiguous, or confidence < 0.70).
8. "estimatedWeightKg": realistic estimated weight in kilograms.
9. "cleanliness": "clean" or "dirty".
10. "structural": "intact" or "damaged".
11. "materials": array of recovered recyclable materials (e.g. ["Copper", "Silicon", "Aluminum"]).
12. "hazardousElements": array of hazardous elements detected (e.g. ["None Detected"] or ["Lithium Electrolyte"]).
13. "safetyGuidanceEn": Practical scrap handling advice in English.
14. "safetyGuidanceHi": Practical scrap handling advice in Hindi.
`;

export function normalizeCategory(rawCategory: string, detectedItemName: string = ''): ValidCategory {
  if (!rawCategory) return 'Mixed/Other';
  const clean = rawCategory.trim();
  const directMatch = VALID_CATEGORIES.find((c) => c.toLowerCase() === clean.toLowerCase());
  if (directMatch) return directMatch;

  const search = `${clean} ${detectedItemName}`.toLowerCase();
  if (search.includes('board') || search.includes('pcb') || search.includes('motherboard')) return 'PCBs & Circuit Boards';
  if (search.includes('battery') || search.includes('lithium') || search.includes('cell')) return 'Lithium-ion & Batteries';
  if (search.includes('wire') || search.includes('cable') || search.includes('motor') || search.includes('copper')) return 'Copper Wire & Motors';
  if (search.includes('phone') || search.includes('tablet') || search.includes('mobile')) return 'Smartphones & Tablets';
  if (search.includes('laptop') || search.includes('computer') || search.includes('cpu')) return 'Laptops & Computers';
  if (search.includes('display') || search.includes('monitor') || search.includes('screen') || search.includes('crt') || search.includes('tv')) return 'Displays & CRT Monitors';
  if (search.includes('ac') || search.includes('fridge') || search.includes('refrigerator') || search.includes('washing')) return 'Large White Goods & ACs';
  if (search.includes('mixer') || search.includes('iron') || search.includes('kettle') || search.includes('appliance') || search.includes('toaster')) return 'Small Home Appliances';
  if (search.includes('light') || search.includes('bulb') || search.includes('tube') || search.includes('cfl') || search.includes('lamp')) return 'Fluorescent & LED Lighting';
  if (search.includes('solar') || search.includes('inverter') || search.includes('panel')) return 'Solar PV Panels & Inverters';
  if (search.includes('electronic') || search.includes('charger') || search.includes('adapter')) return 'E-waste';
  if (search.includes('glass') || search.includes('cullet')) return 'Glass';
  if (search.includes('paper') || search.includes('cardboard') || search.includes('carton') || search.includes('box') || search.includes('raddi')) return 'Paper/Cardboard';
  if (search.includes('plastic') || search.includes('bottle') || search.includes('pet') || search.includes('bucket')) return 'Plastic';
  if (search.includes('metal') || search.includes('steel') || search.includes('iron') || search.includes('aluminum') || search.includes('tin')) return 'Metal';
  if (search.includes('cloth') || search.includes('fabric') || search.includes('textile')) return 'Textile';
  if (search.includes('tyre') || search.includes('tire') || search.includes('rubber')) return 'Rubber';
  if (search.includes('organic') || search.includes('food') || search.includes('compost')) return 'Organic';

  return 'Mixed/Other';
}

/**
 * Executes a Gemini Vision classification call using direct REST fetch.
 */
export async function executeGeminiVisionRest(
  base64Data: string,
  mimeType: string,
  apiKey: string,
  _language: string = 'hi'
): Promise<GeminiClassificationResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Missing Gemini API Key');
  }

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: CLASSIFICATION_PROMPT,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        const errObj = { status: res.status, message: errorText };
        lastError = errObj;
        console.warn(`Model ${model} returned ${res.status}:`, errorText.slice(0, 150));
        // Continue to next model if quota or unavailable
        continue;
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('No content returned from Gemini');
      }

      const parsed = JSON.parse(rawText);
      const category = normalizeCategory(parsed.category, parsed.detectedItemName);

      return {
        success: true,
        source: model,
        category,
        confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.2, parsed.confidence)) : 0.90,
        detectedItemName: parsed.detectedItemName || category,
        detectedItemNameHi: parsed.detectedItemNameHi || 'कबाड़ सामग्री',
        secondaryCategory: parsed.secondaryCategory || 'Small Home Appliances',
        secondaryConfidence: parsed.secondaryConfidence || 0.15,
        isUncertain: Boolean(parsed.isUncertain || (parsed.confidence && parsed.confidence < 0.7)),
        estimatedWeightKg: typeof parsed.estimatedWeightKg === 'number' ? Math.max(0.1, parsed.estimatedWeightKg) : 4.0,
        cleanliness: parsed.cleanliness === 'dirty' ? 'dirty' : 'clean',
        structural: parsed.structural === 'damaged' ? 'damaged' : 'intact',
        materials: Array.isArray(parsed.materials) ? parsed.materials : ['Recoverable Scrap Grade A'],
        hazardousElements: Array.isArray(parsed.hazardousElements) ? parsed.hazardousElements : ['None Detected'],
        safetyGuidanceEn: parsed.safetyGuidanceEn || 'Wear puncture-resistant gloves and inspect for sharp edges.',
        safetyGuidanceHi: parsed.safetyGuidanceHi || 'दस्ताने पहनें और नुकीले किनारों से सावधान रहें।',
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt with ${model} failed:`, err?.message || err);
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || JSON.stringify(lastError)}`);
}
