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
    
    // ✅ PRO MODEL: Meta Llama 3 70B running on Groq
    const MODEL = "llama3-70b-8192";
    const API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    console.log("📝 Topic:", topic);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert educational assistant. Write clear, structured, and professional notes."
          },
          {
            role: "user",
            content: `Write detailed and structured notes on: ${topic}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500, // Aap isko badha bhi sakte ho
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
    
    // Groq OpenAI-compatible format return karta hai
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
        tip: "Check Netlify function logs"
      }),
    };
  }
};
