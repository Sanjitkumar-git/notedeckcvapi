// netlify/functions/generateNotes.js
exports.handler = async (event) => {
  // ✅ 1. Preflight (OPTIONS) request (CORS error se bachne ke liye)
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
    
    // ✅ 2. USING HUGGING FACE FREE PRO MODEL (No new API key needed)
    // Yeh Flan-T5 se bohot zyada smart hai aur notes proper format mein dega
    const MODEL = "HuggingFaceH4/zephyr-7b-beta";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
    
    console.log("📝 Topic:", topic);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`, // Aapka purana free token
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Zephyr model ka proper prompt format
        inputs: `<|system|>\nYou are an expert educational assistant. Write clear, structured, and professional notes using headings and bullet points.<|end|>\n<|user|>\nWrite detailed notes on: ${topic}<|end|>\n<|assistant|>\n`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.5,
          return_full_text: false // Aapka question repeat nahi karega
        },
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
    
    // Hugging face array format return karta hai
    const notes = data[0]?.generated_text || data.generated_text || "No notes generated";

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        notes: notes.trim(),
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
        tip: "Check Netlify logs and ensure HF_TOKEN is valid."
      }),
    };
  }
};
