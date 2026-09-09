/**
 * ScrapSetu Multi-Tier Classification Client
 * 1. Primary: Configured Backend / Cloudflare Edge Function (/api/classify)
 * 2. Secondary: Direct Gemini Vision REST call from browser (if key is set or static Cloudflare Pages)
 * 3. Tertiary: Fallback Cloud Run Container backend
 * 4. Offline: Local heuristic / pixel-based classifier
 */

import { WasteCategory } from '../types';
import { getApiUrl, getStoredGeminiApiKey, DEFAULT_PRODUCTION_BACKEND_URL } from './apiConfig';
import { executeGeminiVisionRest, GeminiClassificationResult } from './geminiCore';
import { classifyScrapLocally } from './imageClassifier';

export interface UnifiedClassificationResponse {
  category: WasteCategory;
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
  source: string;
  provider: 'edge' | 'direct-gemini' | 'cloudrun' | 'offline';
}

/**
 * Extracts base64 and mime-type from an image string (data URL or http URL)
 */
async function extractBase64AndMime(image: string): Promise<{ base64: string; mimeType: string }> {
  if (image.startsWith('data:')) {
    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return { mimeType: matches[1], base64: matches[2] };
    }
    const parts = image.split(',');
    return { mimeType: 'image/jpeg', base64: parts[1] || parts[0] };
  }

  if (image.startsWith('http://') || image.startsWith('https://')) {
    const res = await fetch(image);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          resolve({ mimeType: matches[1], base64: matches[2] });
        } else {
          resolve({ mimeType: blob.type || 'image/jpeg', base64: dataUrl.split(',')[1] });
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return { base64: image, mimeType: 'image/jpeg' };
}

/**
 * Orchestrates scrap classification across all environments
 */
export async function classifyScrapWithAi(
  photoUrl: string,
  presetIndex?: number,
  language: string = 'hi'
): Promise<UnifiedClassificationResponse> {
  const directKey = getStoredGeminiApiKey();

  // 1. Try Primary Backend (Cloudflare Worker / Cloudflare Pages Function / Express)
  const primaryUrl = getApiUrl('/api/classify');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: photoUrl,
        language,
        presetIndex,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json') && res.ok) {
      const data = await res.json();
      if (data.category) {
        return {
          category: data.category,
          confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
          detectedItemName: data.detectedItemName || data.category,
          detectedItemNameHi: data.detectedItemNameHi || 'कबाड़ सामग्री',
          secondaryCategory: data.secondaryCategory || 'Small Home Appliances',
          secondaryConfidence: data.secondaryConfidence || 0.15,
          isUncertain: Boolean(data.isUncertain),
          estimatedWeightKg: typeof data.estimatedWeightKg === 'number' ? data.estimatedWeightKg : 4.0,
          cleanliness: data.cleanliness === 'dirty' ? 'dirty' : 'clean',
          structural: data.structural === 'damaged' ? 'damaged' : 'intact',
          materials: Array.isArray(data.materials) ? data.materials : ['Recoverable Scrap'],
          hazardousElements: Array.isArray(data.hazardousElements) ? data.hazardousElements : ['None Detected'],
          safetyGuidanceEn: data.safetyGuidanceEn || 'Wear safety gloves and inspect for sharp edges.',
          safetyGuidanceHi: data.safetyGuidanceHi || 'सुरक्षा दस्ताने पहनें और नुकीले किनारों से सावधान रहें।',
          source: data.source || 'Cloudflare / Express Edge AI',
          provider: 'edge',
        };
      }
    }
  } catch (err) {
    console.warn('Primary /api/classify endpoint unavailable:', err);
  }

  // 2. Direct Gemini Vision REST Call from Browser (if API key is present)
  if (directKey && photoUrl) {
    try {
      const { base64, mimeType } = await extractBase64AndMime(photoUrl);
      if (base64) {
        const result: GeminiClassificationResult = await executeGeminiVisionRest(
          base64,
          mimeType,
          directKey,
          language
        );

        return {
          ...result,
          provider: 'direct-gemini',
        };
      }
    } catch (directErr) {
      console.warn('Direct client Gemini call failed:', directErr);
    }
  }

  // 3. Try Remote Cloud Run Fallback (if current origin is different, e.g. on static Cloudflare Pages)
  if (primaryUrl !== `${DEFAULT_PRODUCTION_BACKEND_URL}/api/classify`) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${DEFAULT_PRODUCTION_BACKEND_URL}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoUrl,
          language,
          presetIndex,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const data = await res.json();
        if (data.category) {
          return {
            category: data.category,
            confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
            detectedItemName: data.detectedItemName || data.category,
            detectedItemNameHi: data.detectedItemNameHi || 'कबाड़ सामग्री',
            secondaryCategory: data.secondaryCategory || 'Small Home Appliances',
            secondaryConfidence: data.secondaryConfidence || 0.15,
            isUncertain: Boolean(data.isUncertain),
            estimatedWeightKg: typeof data.estimatedWeightKg === 'number' ? data.estimatedWeightKg : 4.0,
            cleanliness: data.cleanliness === 'dirty' ? 'dirty' : 'clean',
            structural: data.structural === 'damaged' ? 'damaged' : 'intact',
            materials: Array.isArray(data.materials) ? data.materials : ['Recoverable Scrap'],
            hazardousElements: Array.isArray(data.hazardousElements) ? data.hazardousElements : ['None Detected'],
            safetyGuidanceEn: data.safetyGuidanceEn || 'Wear safety gloves and inspect for sharp edges.',
            safetyGuidanceHi: data.safetyGuidanceHi || 'सुरक्षा दस्ताने पहनें और नुकीले किनारों से सावधान रहें।',
            source: `${data.source} (Cloud Run)`,
            provider: 'cloudrun',
          };
        }
      }
    } catch (cloudErr) {
      console.warn('Cloud Run fallback failed:', cloudErr);
    }
  }

  // 4. Offline / Local Heuristic fallback
  const local = await classifyScrapLocally(photoUrl, presetIndex);
  return {
    category: local.category,
    confidence: local.confidence,
    detectedItemName: local.detectedItemName,
    detectedItemNameHi: local.detectedItemNameHi,
    secondaryCategory: 'Small Home Appliances',
    secondaryConfidence: 0.15,
    isUncertain: local.isUncertain,
    estimatedWeightKg: local.estimatedWeightKg,
    cleanliness: local.cleanliness,
    structural: local.structural,
    materials: local.materials,
    hazardousElements: local.hazardousElements,
    safetyGuidanceEn: local.safetyGuidanceEn,
    safetyGuidanceHi: local.safetyGuidanceHi,
    source: local.source,
    provider: 'offline',
  };
}
