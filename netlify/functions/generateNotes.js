// netlify/functions/generateNotes.js
exports.handler = async (event) => {
  // 1. Handle CORS Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: "OK"
    };
  }

  try {
    const { topic } = JSON.parse(event.body || "{}");
    
    if (!topic) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Topic is required" })
      };
    }
    
    // ✅ NEW URL FORMAT: OpenAI-compatible endpoint on Hugging Face
    const MODEL = "HuggingFaceH4/zephyr-7b-beta";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL}/v1/chat/completions`;
    
    console.log("📝 Topic:", topic);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`, // Aapka free READ token hi chalega
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert educational assistant. Write clear, structured, and professional notes using markdown."
          },
          {
            role: "user",
            content: `Write detailed notes on: ${topic}`
          }
        ],
        max_tokens: 500,
        temperature: 0.5
      }),
    });

    console.log("📡 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Detail:", errorText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Response Received");
    
    // Extracting notes from the new OpenAI-style JSON structure
    const notes = data.choices[0]?.message?.content || "No notes generated";

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        notes: notes,
        topic: topic,
        model: MODEL
      }),
    };

  } catch (error) {
    console.error("❌ Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ 
        error: error.message,
        tip: "Check Netlify logs and HF_TOKEN."
      }),
    };
  }
};
