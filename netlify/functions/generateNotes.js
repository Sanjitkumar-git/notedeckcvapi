// netlify/functions/generateNotes.js
exports.handler = async (event) => {
  try {
    const { topic } = JSON.parse(event.body || "{}");
    
    if (!topic) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Topic is required" })
      };
    }
    
    // ✅ NAYA WORKING ENDPOINT - Router endpoint
    const MODEL = "Qwen/Qwen2-1.5B-Instruct";
    const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}`;
    
    console.log("📝 Generating notes for:", topic);
    console.log("🤖 Using model:", MODEL);
    console.log("🔗 API URL:", API_URL);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Write structured notes on: ${topic}`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`Hugging Face API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("📦 Response data:", JSON.stringify(data).substring(0, 200));
    
    // Handle different response formats
    let notes = "";
    if (data.generated_text) {
      notes = data.generated_text;
    } else if (data[0]?.generated_text) {
      notes = data[0].generated_text;
    } else {
      notes = JSON.stringify(data);
    }

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
    console.error("❌ Function error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ 
        error: error.message,
        tip: "Check Netlify function logs for more details"
      }),
    };
  }
};
