const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const BASE_URL = 'https://api.anthropic.com/v1/messages';

type FoodResult = {
  name: string;
  portionG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

async function callClaude(model: string, maxTokens: number, messages: object[]): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  return data.content[0].text;
}

export async function analyzeFoodImage(base64: string): Promise<FoodResult> {
  const text = await callClaude('claude-haiku-4-5-20251001', 512, [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        },
        {
          type: 'text',
          text: 'Identify the food in this image and estimate nutritional values. Reply ONLY with valid JSON, no markdown:\n{"name":"...", "portionG":0, "kcal":0, "proteinG":0, "carbsG":0, "fatG":0}',
        },
      ],
    },
  ]);
  return JSON.parse(text.trim());
}

export async function getDailyRecommendation(params: {
  name: string;
  goal: string;
  kcalGoal: number;
  kcalEaten: number;
  kcalBurned: number;
  recoveryScore: number | null;
}): Promise<string> {
  const { name, goal, kcalGoal, kcalEaten, kcalBurned, recoveryScore } = params;
  const remaining = kcalGoal - kcalEaten + kcalBurned;
  const greeting = name ? name : 'deg';

  const prompt = `Du er en personlig helse-assistent. Gi en kort, konkret anbefaling for resten av dagen til ${greeting}.
Mål: ${goal === 'lose' ? 'gå ned i vekt' : goal === 'gain' ? 'bygge muskler' : 'vedlikeholde vekt'}
Kalorimål: ${kcalGoal} kcal | Spist: ${kcalEaten} kcal | Forbrent: ${kcalBurned} kcal | Igjen: ${remaining} kcal
${recoveryScore !== null ? `WHOOP recovery: ${recoveryScore}%` : ''}
Svar med 1-2 setninger på norsk. Vær konkret og motiverende.`;

  return callClaude('claude-haiku-4-5-20251001', 150, [{ role: 'user', content: prompt }]);
}
