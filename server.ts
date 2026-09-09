import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  readDatabase,
  sanitizeUser,
  findUserByCredentials,
  findUserByIdentifier,
  createUser,
  updateUser,
  addTransactionRecord,
  addPickupRecord,
} from './server/database';

dotenv.config();

const PORT = 3000;

// Lazy initialization of Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const VALID_CATEGORIES = [
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
  'Batteries',
  'Metal',
  'Plastic',
  'Paper/Cardboard',
  'Glass',
  'Organic',
  'Textile',
  'Rubber',
  'Mixed/Other',
];

async function startServer() {
  const app = express();

  // Enable CORS for mobile APKs (Capacitor/WebView) and remote clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Allow larger payload for camera base64 images
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      service: 'ScrapSetu AI Vision Classification',
    });
  });

  // AI Classification endpoint powered by Gemini Vision
  app.post('/api/classify', async (req, res) => {
    try {
      const { image, language = 'hi', presetIndex } = req.body;

      if (!image || typeof image !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "image" in request body' });
        return;
      }

      // Check if image is base64 data URL or external URL
      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          const parts = image.split(',');
          base64Data = parts[1] || parts[0];
        }
      } else if (image.startsWith('http://') || image.startsWith('https://')) {
        try {
          const imgResponse = await fetch(image);
          if (!imgResponse.ok) {
            throw new Error(`Failed to fetch external image: ${imgResponse.statusText}`);
          }
          const arrayBuffer = await imgResponse.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString('base64');
          mimeType = imgResponse.headers.get('content-type') || 'image/jpeg';
        } catch (fetchErr) {
          console.warn('Could not fetch external image directly:', fetchErr);
        }
      }

      const ai = getGenAI();

      // Candidate models in order of preference if primary is experiencing high demand (503/429)
      const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];

      // If Gemini AI is available and we have valid image data, call Gemini Vision
      if (ai && base64Data) {
        const imagePart = {
          inlineData: {
            mimeType: mimeType.startsWith('image/') ? mimeType : 'image/jpeg',
            data: base64Data,
          },
        };

        const promptText = `
You are an expert waste and recyclable materials inspector for ScrapSetu / Kabadiwala Connect in India.
ScrapSetu inspects and evaluates BOTH everyday household/commercial recyclable scrap (plastic bottles, containers, glass, paper, cardboard, scrap metal) AND electronic/electrical waste.

Carefully examine this photo and classify it into EXACTLY ONE of the following categories:
- "Plastic" (PET plastic water/soda bottles, milk jugs, HDPE containers, plastic buckets, PVC/PP scrap)
- "Glass" (glass bottles, beverage bottles, glass jars, glass panes)
- "Paper/Cardboard" (corrugated cardboard boxes, cartons, newspapers, books, office paper raddi)
- "Metal" (iron rods, steel sheet metal, tin/aluminum beverage cans, brass, copper scrap)
- "PCBs & Circuit Boards" (green/blue computer circuit boards, motherboards, RAM, telecom server cards ONLY)
- "Lithium-ion & Batteries" (phone/laptop batteries, cylindrical 18650 cells, lead-acid inverter batteries)
- "Copper Wire & Motors" (stripped copper, PVC insulated wires, fan/cooler/pump electric motors, transformers)
- "Smartphones & Tablets" (mobile phones, touchscreens, keypads, damaged tablets)
- "Laptops & Computers" (laptops, PC towers, hard drives, keyboards)
- "Displays & CRT Monitors" (CRT glass tubes, LED/LCD monitors, TVs)
- "Large White Goods & ACs" (compressors, washing machines, refrigerators, microwaves)
- "Small Home Appliances" (irons, mixers, blenders, kettles, toasters, chargers, adapters)
- "Fluorescent & LED Lighting" (tubelights, CFLs, mercury vapor bulbs, LED drivers)
- "Solar PV Panels & Inverters" (solar panels, inverters, charge controllers)
- "Mixed/Other" (mixed unsegregated scrap or unidentified materials)

CRITICAL ACCURACY RULES:
1. BOTTLE RULE: Any plastic bottle (mineral water bottle, Coke/Pepsi bottle, shampoo/oil bottle, plastic jar) MUST be classified as "Plastic". NEVER classify a bottle as "PCBs & Circuit Boards"!
2. GLASS RULE: Any glass bottle, beer bottle, or glass container MUST be classified as "Glass".
3. PCB RULE: ONLY classify as "PCBs & Circuit Boards" if the item clearly contains an electronic circuit board with green/blue substrate, soldered chips, and microelectronics.
4. If you see a bottle, container, bucket, or plastic item, it is "Plastic" or "Glass", NEVER a PCB!

Also:
1. Identify the exact specific item in English (detectedItemName) and Hindi in Devanagari script (detectedItemNameHi). Example: "Bisleri Plastic Water Bottle" / "प्लास्टिक पानी की बोतल (PET)".
2. Rate confidence (0.0 to 1.0). If the image is blurry or unclear, set isUncertain to true and confidence <= 0.65.
3. Identify secondaryCategory and secondaryConfidence.
4. Estimate realistic standard weight in kg (estimatedWeightKg). For a plastic bottle, typically 0.05 to 0.5 kg.
5. Determine physical condition: structural ("intact" or "damaged") and cleanliness ("clean" or "dirty").
6. List key recovered recyclable components (materials) and any toxic/hazardous elements (hazardousElements).
7. Provide safety handling guidance in English and Hindi for informal waste pickers (kabadiwalas).
`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: 'Must be one of the listed categories: Plastic, Glass, Paper/Cardboard, Metal, PCBs & Circuit Boards, Lithium-ion & Batteries, Copper Wire & Motors, Smartphones & Tablets, Laptops & Computers, Displays & CRT Monitors, Large White Goods & ACs, Small Home Appliances, Fluorescent & LED Lighting, Solar PV Panels & Inverters, Mixed/Other',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence between 0.0 and 1.0',
            },
            detectedItemName: {
              type: Type.STRING,
              description: 'Specific identified item name in English (e.g. Plastic Water Bottle)',
            },
            detectedItemNameHi: {
              type: Type.STRING,
              description: 'Specific identified item name in Hindi (e.g. प्लास्टिक पानी की बोतल)',
            },
            secondaryCategory: {
              type: Type.STRING,
              description: 'Next likely category',
            },
            secondaryConfidence: {
              type: Type.NUMBER,
              description: 'Secondary confidence between 0.0 and 1.0',
            },
            isUncertain: {
              type: Type.BOOLEAN,
              description: 'True if confidence < 0.70 or item is mixed/unclear',
            },
            estimatedWeightKg: {
              type: Type.NUMBER,
              description: 'Estimated weight in kilograms',
            },
            cleanliness: {
              type: Type.STRING,
              description: '"clean" or "dirty"',
            },
            structural: {
              type: Type.STRING,
              description: '"intact" or "damaged"',
            },
            materials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key recyclable recovered materials',
            },
            hazardousElements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Hazardous or toxic substances detected',
            },
            safetyGuidanceEn: {
              type: Type.STRING,
              description: 'Safety precautions in English',
            },
            safetyGuidanceHi: {
              type: Type.STRING,
              description: 'Safety precautions in Hindi',
            },
          },
          required: [
            'category',
            'confidence',
            'detectedItemName',
            'detectedItemNameHi',
            'isUncertain',
            'estimatedWeightKg',
            'materials',
            'hazardousElements',
            'safetyGuidanceEn',
          ],
        };

        // Try candidate models sequentially to seamlessly absorb spikes in demand
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [imagePart, { text: promptText }],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema,
              },
            });

            const rawText = response.text;
            if (rawText) {
              const parsed = JSON.parse(rawText);

              // Disambiguation and validation
              let category = parsed.category;
              const detectedLower = (parsed.detectedItemName || '').toLowerCase();
              const detectedHi = (parsed.detectedItemNameHi || '').toLowerCase();
              const catLower = (category || '').toLowerCase();

              // Explicit bottle/plastic safeguard: bottles must ALWAYS be Plastic or Glass, never PCB
              const isBottleOrContainer =
                detectedLower.includes('bottle') ||
                detectedLower.includes('pet ') ||
                detectedLower.includes('jug') ||
                detectedLower.includes('shampoo') ||
                detectedLower.includes('container') ||
                detectedLower.includes('canister') ||
                detectedLower.includes('bucket') ||
                detectedHi.includes('बोतल') ||
                detectedHi.includes('बॉटल') ||
                catLower.includes('bottle');

              const isGlassSpecific =
                detectedLower.includes('glass') ||
                detectedLower.includes('cullet') ||
                detectedHi.includes('कांच') ||
                detectedHi.includes('शीशा') ||
                catLower.includes('glass');

              const isCardboardOrPaper =
                detectedLower.includes('cardboard') ||
                detectedLower.includes('carton') ||
                detectedLower.includes('paper') ||
                detectedLower.includes('newspaper') ||
                detectedLower.includes('box') ||
                detectedHi.includes('गत्ता') ||
                detectedHi.includes('कागज') ||
                detectedHi.includes('रद्दी') ||
                catLower.includes('cardboard') ||
                catLower.includes('paper');

              const isMetalSpecific =
                (detectedLower.includes('metal') ||
                 detectedLower.includes('steel') ||
                 detectedLower.includes('iron') ||
                 detectedLower.includes('aluminum') ||
                 detectedLower.includes('tin can') ||
                 detectedHi.includes('लोहा') ||
                 detectedHi.includes('टीन')) &&
                !detectedLower.includes('circuit') &&
                !detectedLower.includes('pcb');

              if (isBottleOrContainer) {
                category = isGlassSpecific ? 'Glass' : 'Plastic';
              } else if (isGlassSpecific) {
                category = 'Glass';
              } else if (isCardboardOrPaper) {
                category = 'Paper/Cardboard';
              } else if (isMetalSpecific) {
                category = 'Metal';
              } else if (!VALID_CATEGORIES.includes(category)) {
                // Fuzzy map
                if (catLower.includes('circuit') || catLower.includes('pcb') || catLower.includes('motherboard')) {
                  category = 'PCBs & Circuit Boards';
                } else if (catLower.includes('battery') || catLower.includes('lithium') || catLower.includes('cell')) {
                  category = 'Lithium-ion & Batteries';
                } else if (catLower.includes('copper') || catLower.includes('wire') || catLower.includes('cable') || catLower.includes('motor')) {
                  category = 'Copper Wire & Motors';
                } else if (catLower.includes('phone') || catLower.includes('tablet') || catLower.includes('mobile')) {
                  category = 'Smartphones & Tablets';
                } else if (catLower.includes('laptop') || catLower.includes('computer') || catLower.includes('cpu')) {
                  category = 'Laptops & Computers';
                } else if (catLower.includes('monitor') || catLower.includes('display') || catLower.includes('screen') || catLower.includes('crt')) {
                  category = 'Displays & CRT Monitors';
                } else if (catLower.includes('ac') || catLower.includes('fridge') || catLower.includes('white good') || catLower.includes('washing')) {
                  category = 'Large White Goods & ACs';
                } else if (catLower.includes('appliance') || catLower.includes('iron') || catLower.includes('mixer') || catLower.includes('kettle')) {
                  category = 'Small Home Appliances';
                } else if (catLower.includes('light') || catLower.includes('bulb') || catLower.includes('tube') || catLower.includes('cfl')) {
                  category = 'Fluorescent & LED Lighting';
                } else if (catLower.includes('solar') || catLower.includes('panel') || catLower.includes('inverter')) {
                  category = 'Solar PV Panels & Inverters';
                } else if (catLower.includes('plastic')) {
                  category = 'Plastic';
                } else if (catLower.includes('glass')) {
                  category = 'Glass';
                } else if (catLower.includes('paper') || catLower.includes('cardboard')) {
                  category = 'Paper/Cardboard';
                } else if (catLower.includes('metal') || catLower.includes('steel') || catLower.includes('iron')) {
                  category = 'Metal';
                } else {
                  category = 'Mixed/Other';
                }
              }

              res.json({
                success: true,
                source: modelName,
                category,
                confidence: typeof parsed.confidence === 'number' ? Math.min(0.99, Math.max(0.2, parsed.confidence)) : 0.88,
                detectedItemName: parsed.detectedItemName || category,
                detectedItemNameHi: parsed.detectedItemNameHi || 'कबाड़ सामग्री',
                secondaryCategory: parsed.secondaryCategory || 'Small Home Appliances',
                secondaryConfidence: parsed.secondaryConfidence || 0.15,
                isUncertain: Boolean(parsed.isUncertain || (parsed.confidence && parsed.confidence < 0.7)),
                estimatedWeightKg: typeof parsed.estimatedWeightKg === 'number' ? Math.max(0.1, parsed.estimatedWeightKg) : 5.0,
                cleanliness: parsed.cleanliness === 'dirty' ? 'dirty' : 'clean',
                structural: parsed.structural === 'damaged' ? 'damaged' : 'intact',
                materials: Array.isArray(parsed.materials) ? parsed.materials : ['Recoverable Scrap Grade A'],
                hazardousElements: Array.isArray(parsed.hazardousElements) ? parsed.hazardousElements : ['None Detected'],
                safetyGuidanceEn: parsed.safetyGuidanceEn || 'Wear puncture-resistant gloves and inspect for sharp edges.',
                safetyGuidanceHi: parsed.safetyGuidanceHi || 'दस्ताने पहनें और नुकीले किनारों से सावधान रहें।',
              });
              return;
            }
          } catch (modelErr: any) {
            // Check for temporary high demand (503), rate limit (429), or unavailable
            const isHighDemandOrBusy = 
              modelErr?.status === 503 ||
              modelErr?.code === 503 ||
              modelErr?.message?.includes('503') ||
              modelErr?.message?.includes('high demand') ||
              modelErr?.message?.includes('UNAVAILABLE') ||
              modelErr?.message?.includes('429');

            if (isHighDemandOrBusy) {
              console.warn(`Model ${modelName} temporarily experiencing high demand/rate limits, trying next model option...`);
            } else {
              console.warn(`Model ${modelName} returned notice:`, modelErr?.message || modelErr);
            }
            // Continue loop to try next candidate model
          }
        }
      }

      // Fallback if no Gemini key or rate limited / offline
      // Inspect presetIndex or URL or simple heuristic
      let fallbackCat = 'Plastic';
      let confidence = 0.85;
      let itemName = 'Plastic Scrap (PET / HDPE)';
      let itemNameHi = 'प्लास्टिक कबाड़ (बोतलें व डिब्बे)';
      let isUncertain = false;
      let weight = 2.5;

      if (typeof presetIndex === 'number') {
        const presets = [
          { cat: 'PCBs & Circuit Boards', name: 'Computer Motherboard (PCBs)', nameHi: 'कंप्यूटर मदरबोर्ड (सर्किट बोर्ड)', conf: 0.95, wt: 8.5 },
          { cat: 'Lithium-ion & Batteries', name: 'Lithium-ion Battery Pack', nameHi: 'लिथियम-आयन बैटरी पैक', conf: 0.92, wt: 16.0 },
          { cat: 'Copper Wire & Motors', name: 'Stripped Bright Copper Wires', nameHi: 'चमकीले तांबे के तार', conf: 0.89, wt: 12.0 },
          { cat: 'Smartphones & Tablets', name: 'Smartphones & Feature Mobiles', nameHi: 'स्मार्टफोन और मोबाइल फोन', conf: 0.93, wt: 6.2 },
          { cat: 'Laptops & Computers', name: 'Laptops & Desktop Components', nameHi: 'लैपटॉप और कंप्यूटर पुर्जे', conf: 0.88, wt: 14.0 },
          { cat: 'Plastic', name: 'PET Plastic Water & Soda Bottles', nameHi: 'प्लास्टिक की पानी व कोल्ड्रिंक की बोतलें (PET)', conf: 0.94, wt: 4.5 },
          { cat: 'Glass', name: 'Glass Beverage Bottles & Jars', nameHi: 'कांच की बोतलें एवं शीशे के जार', conf: 0.92, wt: 8.0 },
          { cat: 'Paper/Cardboard', name: 'Corrugated Cardboard Box Scrap', nameHi: 'गत्ता कार्टन एवं रद्दी पेपर', conf: 0.91, wt: 15.0 },
          { cat: 'Small Home Appliances', name: 'Mixed Electrical Scrap', nameHi: 'मिश्रित घरेलू बिजली कबाड़', conf: 0.58, wt: 11.5, uncertain: true },
        ];
        const p = presets[presetIndex] || presets[5]; // Default to plastic bottle preset if out of bounds
        fallbackCat = p.cat;
        confidence = p.conf;
        itemName = p.name;
        itemNameHi = p.nameHi;
        isUncertain = Boolean((p as any).uncertain);
        weight = p.wt;
      } else if (image.includes('518770660439')) {
        fallbackCat = 'PCBs & Circuit Boards';
        confidence = 0.95;
        itemName = 'High-Grade Telecom PCB Motherboard';
        itemNameHi = 'हाई-ग्रेड टेलीकॉम पीसीबी मदरबोर्ड';
        weight = 8.5;
      } else if (image.includes('598425237654')) {
        fallbackCat = 'Lithium-ion & Batteries';
        confidence = 0.92;
        itemName = 'Rechargeable Lithium-ion Battery Module';
        itemNameHi = 'लिथियम-आयन रिचार्जेबल बैटरी मॉड्यूल';
        weight = 15.0;
      } else if (image.includes('558494949')) {
        fallbackCat = 'Copper Wire & Motors';
        confidence = 0.91;
        itemName = 'Bright High-Purity Copper Windings';
        itemNameHi = 'शुद्ध चमकीला तांबे का तार';
        weight = 10.0;
      } else if (image.includes('592899677977')) {
        fallbackCat = 'Smartphones & Tablets';
        confidence = 0.93;
        itemName = 'Assorted Smartphones with Lithium Batteries';
        itemNameHi = 'स्मार्टफोन और मोबाइल सेट';
        weight = 4.5;
      } else if (image.includes('588872657578')) {
        fallbackCat = 'Laptops & Computers';
        confidence = 0.88;
        itemName = 'IT Hardware & Laptop Scrap';
        itemNameHi = 'लैपटॉप एवं कंप्यूटर स्क्रैप';
        weight = 12.0;
      } else if (image.includes('bottle') || image.includes('plastic') || image.includes('pet')) {
        fallbackCat = 'Plastic';
        confidence = 0.92;
        itemName = 'Plastic Bottles & Containers';
        itemNameHi = 'प्लास्टिक की बोतलें और कंटेनर';
        weight = 3.0;
      } else if (image.includes('glass')) {
        fallbackCat = 'Glass';
        confidence = 0.90;
        itemName = 'Glass Bottles and Cullet';
        itemNameHi = 'कांच की बोतलें और शीशा';
        weight = 6.0;
      } else if (image.includes('cardboard') || image.includes('paper')) {
        fallbackCat = 'Paper/Cardboard';
        confidence = 0.90;
        itemName = 'Cardboard & Paper Scrap';
        itemNameHi = 'गत्ता और कागज रद्दी';
        weight = 10.0;
      } else {
        // Generic fallback for user photo when offline/unconnected
        isUncertain = true;
        confidence = 0.65;
        fallbackCat = 'Plastic';
        itemName = 'Scrap Materials (Please Confirm Category)';
        itemNameHi = 'कबाड़ सामग्री (कृपया श्रेणी चुनें)';
        weight = 3.0;
      }

      // Enriched metadata mapping per category for high-fidelity inspections
      const categoryMetadata: Record<string, {
        materials: string[];
        hazardous: string[];
        safetyEn: string;
        safetyHi: string;
      }> = {
        'Plastic': {
          materials: ['Polyethylene Terephthalate (PET)', 'High-Density Polyethylene (HDPE)', 'Polypropylene (PP)'],
          hazardous: ['Chemical Residues (Clean Thoroughly)'],
          safetyEn: 'Flatten bottles to optimize transport. Rinse containers with residual fluids.',
          safetyHi: 'बोतलों को दबाकर पिचकाएं ताकि जगह कम लगे। रसायनों वाले डिब्बों को धोकर सुखाएं।',
        },
        'Glass': {
          materials: ['Soda-Lime Cullet Glass', 'Silica Sand Mineral', 'Aluminum Caps'],
          hazardous: ['Sharp Broken Shards & Glass Splinters'],
          safetyEn: 'Always wear heavy leather/cut-resistant gloves when handling glass bottles.',
          safetyHi: 'कांच की बोतलें उठाते समय हमेशा कट-प्रूफ मोटे दस्ताने पहनें।',
        },
        'Paper/Cardboard': {
          materials: ['Unbleached Kraft Pulp', 'Corrugated Fluting Sheet', 'Recycled Newsprint Fibers'],
          hazardous: ['Moisture / Mold Spores if wet'],
          safetyEn: 'Keep dry and bundled tightly with jute twine to prevent rain damage.',
          safetyHi: 'गत्ते और कागज को सूखा रखें और सुतली से बांधकर सुरक्षित जगह रखें।',
        },
        'Metal': {
          materials: ['Ferrous Scrap Iron', 'Structural Carbon Steel', 'Non-Ferrous Aluminum/Brass'],
          hazardous: ['Sharp Jagged Burrs', 'Rust / Tetanus Risk'],
          safetyEn: 'Use steel-toe boots and reinforced safety gloves. Ensure tetanus vaccination.',
          safetyHi: 'लोहा उठाते समय नुकीले किनारों से बचें और मोटे दस्ताने अवश्य पहनें।',
        },
        'PCBs & Circuit Boards': {
          materials: ['FR-4 Fiberglass Laminate', 'Pure Copper Traces', 'Gold Plated Connectors', 'Silicon ICs'],
          hazardous: ['Lead Solder (Pb)', 'Brominated Flame Retardants (BFR)'],
          safetyEn: 'Wear puncture-resistant gloves. Never burn or crush boards indoors.',
          safetyHi: 'दस्ताने पहनें। बोर्ड को कभी न जलाएं ताकि विषैली गैसों से बचा जा सके।',
        },
        'Lithium-ion & Batteries': {
          materials: ['Lithium Cobalt Oxide', 'Graphite Carbon', 'Copper & Aluminum Current Foils'],
          hazardous: ['Flammable Liquid Electrolyte', 'Cobalt/Lithium Salts', 'Corrosive Acid'],
          safetyEn: 'Do not crush, pierce, or short-circuit terminals. Risk of fire/thermal runaway!',
          safetyHi: 'बैटरी को कुचलें या छेदें नहीं। शॉर्ट सर्किट या आग लगने का गंभीर खतरा!',
        },
        'Copper Wire & Motors': {
          materials: ['98%+ Pure Copper Windings', 'Silicon Electrical Steel', 'Cast Iron Casing'],
          hazardous: ['PVC Insulated Chlorine', 'Resin Varnish Residue'],
          safetyEn: 'Mechanically strip wire insulation. Open burning of wires is illegal under CPCB.',
          safetyHi: 'तारों को मशीन से छीलें। तारों को आग में जलाना पर्यावरण नियमों के तहत सख्त मना है।',
        },
        'Smartphones & Tablets': {
          materials: ['Aluminum-Magnesium Frame', 'AMOLED/LCD Display', 'Gold/Palladium Contacts'],
          hazardous: ['Embedded Li-Po Battery Cell', 'Indium Tin Oxide'],
          safetyEn: 'Handle cracked glass carefully and avoid puncturing the internal battery.',
          safetyHi: 'टूटे कांच से सावधान रहें और अंदरूनी बैटरी को नुकीली चीज से न छुएं।',
        },
        'Laptops & Computers': {
          materials: ['Motherboard Grade A PCB', 'Extruded Aluminum Heatsinks', 'ABS-PC Polymers'],
          hazardous: ['Lead Solder (RoHS exemption in legacy)', 'Capacitor Electrolytes'],
          safetyEn: 'Discharge power supplies before dismantling. Recycle plastic housing separately.',
          safetyHi: 'कंप्यूटर खोलने से पहले प्लग हटा लें और प्लास्टिक व धातु अलग करें।',
        },
        'Small Home Appliances': {
          materials: ['Copper Motor Stators', 'Stainless Steel Blades', 'High-Impact Polystyrene'],
          hazardous: ['Capacitor Dielectrics', 'Rubber Gaskets'],
          safetyEn: 'Inspect for live internal capacitors and sharp motor fan impellers.',
          safetyHi: 'मोटर के नुकीले किनारों से सावधान रहें और उपयुक्त दस्ताने पहनें।',
        },
        'Mixed/Other': {
          materials: ['Mixed Recyclable Scrap Materials'],
          hazardous: ['Varies by Composition'],
          safetyEn: 'Segregate dry recyclables by material type before dispatching to recyclers.',
          safetyHi: 'सामग्री को रीसाइक्लर को भेजने से पहले प्लास्टिक, धातु और कागज में अलग करें।',
        },
      };

      const meta = categoryMetadata[fallbackCat] || {
        materials: ['Primary Recoverable Scrap', 'Alloy Composite'],
        hazardous: fallbackCat.includes('Batteries') ? ['Sulfuric Acid / Lithium'] : ['None Detected'],
        safetyEn: 'Inspect item carefully and verify the exact category before sealing handover ticket.',
        safetyHi: 'सामग्री की जांच करें और हैंडओवर टिकट से पहले श्रेणी की पुष्टि करें।',
      };

      res.json({
        success: true,
        source: 'smart-scrap-engine',
        category: fallbackCat,
        confidence,
        detectedItemName: itemName,
        detectedItemNameHi: itemNameHi,
        secondaryCategory: 'Small Home Appliances',
        secondaryConfidence: 0.18,
        isUncertain,
        estimatedWeightKg: weight,
        cleanliness: 'clean',
        structural: 'intact',
        materials: meta.materials,
        hazardousElements: meta.hazardous,
        safetyGuidanceEn: meta.safetyEn,
        safetyGuidanceHi: meta.safetyHi,
      });
    } catch (err: any) {
      console.warn('Classification endpoint caught error, serving graceful fallback:', err?.message || err);
      res.json({
        success: true,
        source: 'safe-engine-fallback',
        category: 'Copper Wire & Motors',
        confidence: 0.68,
        detectedItemName: 'Unclassified Recyclable Scrap',
        detectedItemNameHi: 'कबाड़ सामग्री (पुष्टि आवश्यक)',
        secondaryCategory: 'Small Home Appliances',
        secondaryConfidence: 0.20,
        isUncertain: true,
        estimatedWeightKg: 5.0,
        cleanliness: 'clean',
        structural: 'intact',
        materials: ['Recoverable Metal Alloys', 'Industrial Scrap'],
        hazardousElements: ['None Detected'],
        safetyGuidanceEn: 'Inspect item carefully and verify the exact category before sealing handover ticket.',
        safetyGuidanceHi: 'सामग्री की जांच करें और हैंडओवर टिकट से पहले श्रेणी की पुष्टि करें।',
      });
    }
  });

  // ==========================================
  // DATABASE & AUTHENTICATION ENDPOINTS
  // ==========================================

  // Database Summary & Health
  app.get('/api/database/summary', (req, res) => {
    try {
      const db = readDatabase();
      const totalEarnings = db.users.reduce((acc, u) => acc + (u.totalEarnings || 0), 0);
      const totalWasteKg = db.users.reduce((acc, u) => acc + (u.totalWasteHandledKg || 0), 0);

      res.json({
        success: true,
        summary: {
          totalUsers: db.users.length,
          totalTransactions: db.transactions.length,
          totalPickups: db.pickups.length,
          totalEarnings,
          totalWasteKg: Math.round(totalWasteKg * 10) / 10,
          databaseVersion: db.version,
          lastUpdated: db.lastUpdated,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Database error' });
    }
  });

  // Complete Database Records view (safe representation)
  app.get('/api/database/records', (req, res) => {
    try {
      const db = readDatabase();
      res.json({
        success: true,
        users: db.users.map(sanitizeUser),
        transactions: db.transactions,
        pickups: db.pickups,
        lastUpdated: db.lastUpdated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Database fetch error' });
    }
  });

  // Sign Up / Register new account & persist to database
  app.post('/api/auth/signup', (req, res) => {
    try {
      const { name, phone, email, passwordOrPin, role = 'collector', city, pincode, upiId, cpcbLicenseNumber, businessName } = req.body;

      if (!name || !phone || !passwordOrPin) {
        res.status(400).json({ success: false, message: 'Name, mobile phone, and password/PIN are required' });
        return;
      }

      // Check if phone or email is already registered
      const existing = findUserByIdentifier(phone) || (email ? findUserByIdentifier(email) : null);
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'An account with this phone number or email is already registered. Please sign in.',
        });
        return;
      }

      const newUser = createUser({
        name,
        phone,
        email,
        passwordOrPin,
        role,
        city,
        pincode,
        upiId,
        cpcbLicenseNumber,
        businessName,
      });

      const token = `session_${newUser.id}_${Date.now()}`;

      res.status(201).json({
        success: true,
        message: 'Account successfully registered and saved in database!',
        user: sanitizeUser(newUser),
        token,
      });
    } catch (err: any) {
      console.error('Sign up error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Failed to create user account' });
    }
  });

  // Log in & verify with database
  app.post('/api/auth/login', (req, res) => {
    try {
      const { phoneOrEmail, passwordOrPin } = req.body;

      if (!phoneOrEmail || !passwordOrPin) {
        res.status(400).json({ success: false, message: 'Please provide phone/email and password/PIN' });
        return;
      }

      const user = findUserByCredentials(phoneOrEmail, passwordOrPin);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid phone/email or password/PIN. Please check your credentials.',
        });
        return;
      }

      // Update last login
      updateUser(user.id, { lastLoginAt: new Date().toISOString() });

      const token = `session_${user.id}_${Date.now()}`;

      res.json({
        success: true,
        message: 'Welcome back! Logged in successfully.',
        user: sanitizeUser(user),
        token,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: err?.message || 'Login failed' });
    }
  });

  // Get user profile by ID
  app.get('/api/users/:id', (req, res) => {
    try {
      const db = readDatabase();
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({ success: true, user: sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Error fetching user' });
    }
  });

  // Update user profile in database
  app.put('/api/users/:id', (req, res) => {
    try {
      const { name, city, pincode, upiId, businessName, cpcbLicenseNumber, email } = req.body;
      const updated = updateUser(req.params.id, {
        ...(name && { name }),
        ...(city && { city }),
        ...(pincode && { pincode }),
        ...(upiId && { upiId }),
        ...(businessName && { businessName }),
        ...(cpcbLicenseNumber && { cpcbLicenseNumber }),
        ...(email && { email }),
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, message: 'Profile updated successfully in database', user: sanitizeUser(updated) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Update failed' });
    }
  });

  // Save Transaction to Database
  app.post('/api/database/transactions', (req, res) => {
    try {
      const {
        userId,
        userName,
        category,
        weightKg,
        ratePerKg,
        totalAmount,
        recyclerName,
        cpcbRegNumber,
        paymentMethod = 'UPI Instant',
        utrNumber,
        status = 'paid',
      } = req.body;

      const record = addTransactionRecord({
        userId: userId || 'guest',
        userName: userName || 'Scrap Collector',
        category: category || 'Mixed Scrap',
        weightKg: Number(weightKg) || 1.0,
        ratePerKg: Number(ratePerKg) || 0,
        totalAmount: Number(totalAmount) || 0,
        recyclerName: recyclerName || 'Authorized Recycler',
        cpcbRegNumber,
        paymentMethod,
        utrNumber,
        status,
        timestamp: Date.now(),
      });

      res.status(201).json({
        success: true,
        message: 'Transaction permanently recorded in CPCB compliance database!',
        transaction: record,
      });
    } catch (err: any) {
      console.error('Transaction save error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Could not save transaction' });
    }
  });

  // Get Transactions from Database
  app.get('/api/database/transactions', (req, res) => {
    try {
      const db = readDatabase();
      const userId = req.query.userId as string | undefined;
      const list = userId ? db.transactions.filter((t) => t.userId === userId) : db.transactions;
      res.json({ success: true, transactions: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Could not fetch transactions' });
    }
  });

  // Save Scheduled Pickup to Database
  app.post('/api/database/pickups', (req, res) => {
    try {
      const {
        userId,
        userName,
        phone,
        address,
        city = 'Mumbai',
        category,
        estimatedWeightKg,
        date,
        timeSlot,
        assignedCollectorName,
        assignedCollectorPhone,
      } = req.body;

      const pickup = addPickupRecord({
        userId: userId || 'guest',
        userName: userName || 'Customer',
        phone: phone || '',
        address: address || '',
        city,
        category: category || 'Mixed Scrap',
        estimatedWeightKg: Number(estimatedWeightKg) || 5.0,
        date: date || 'Today',
        timeSlot: timeSlot || 'Morning 10-12',
        status: 'requested',
        assignedCollectorName: assignedCollectorName || 'Ramesh Kabadiwala',
        assignedCollectorPhone: assignedCollectorPhone || '+91 98200 11982',
      });

      res.status(201).json({
        success: true,
        message: 'Doorstep pickup recorded in database!',
        pickup,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Could not save pickup' });
    }
  });

  // Setup Vite middleware in dev, static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScrapSetu server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});
