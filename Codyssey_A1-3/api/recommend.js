export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: { message: "POST 요청만 가능합니다." },
    });
  }

  try {
    const { ingredients, condition } = req.body || {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "냉장고 재료를 한 개 이상 입력해 주세요." },
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: { message: "OPENROUTER_API_KEY가 설정되지 않았습니다." },
      });
    }

    const prompt = `
당신은 냉장고 재료를 활용해 현실적으로 만들 수 있는 요리를 추천하는 요리 전문가입니다.
사용 가능한 재료: ${ingredients.join(", ")}
추가 조건: ${condition || "특별한 조건 없음"}
서로 다른 레시피 5개를 한국어로 추천하세요.
반드시 아래 JSON 형식만 반환하세요. 다른 텍스트는 절대 포함하지 마세요.
{
  "recipes": [
    {
      "name": "요리 이름",
      "summary": "한 줄 소개",
      "time": "예상 조리 시간 (예: 약 20분)",
      "difficulty": "쉬움 / 보통 / 어려움",
      "ingredients": ["재료1 적정량", "재료2 적정량"],
      "steps": ["1단계 설명", "2단계 설명", "3단계 설명"],
      "tip": "냉털 팁 (선택, 없으면 빈 문자열)"
    }
  ]
}
입력하지 않은 재료는 최소한으로 사용하고, 일반적인 양념은 사용 가능합니다.
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",  // 원하는 모델로 변경 가능
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(response.status).json({
        success: false,
        error: { message: data?.error?.message || "OpenRouter API 요청 중 오류가 발생했습니다." },
      });
    }

    const text = data?.choices?.[0]?.message?.content || "";

    if (!text) {
      return res.status(500).json({
        success: false,
        error: { message: "AI가 레시피를 생성하지 못했습니다." },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("JSON 파싱 실패:", text);
      return res.status(500).json({
        success: false,
        error: { message: "AI 응답을 파싱하지 못했습니다. 다시 시도해 주세요." },
      });
    }

    if (!Array.isArray(parsed?.recipes) || parsed.recipes.length === 0) {
      return res.status(500).json({
        success: false,
        error: { message: "레시피 결과가 비어 있어요. 다시 시도해 주세요." },
      });
    }

    return res.status(200).json({
      success: true,
      recipes: parsed.recipes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: { message: "서버 오류가 발생했습니다." },
    });
  }
}