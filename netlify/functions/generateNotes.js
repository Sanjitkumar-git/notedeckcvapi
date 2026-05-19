exports.handler = async (event) => {
  try {
    const { topic } = JSON.parse(event.body || "{}");
    
    // ✅ CORRECT ENDPOINT - Abhi working hai
    const API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-large";
    
    // Important: Content-Type header MAT hatao, Hugging Face khud detect karega
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: `Write structured notes on: ${topic}`,
        options: {
          wait_for_model: true,  // Model load hone ka wait karega
          use_cache: false,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
    }

    // Hugging Face abhi bhi array return karta hai
    const data = await response.json();
    const generatedText = Array.isArray(data) ? data[0]?.generated_text : data;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        notes: generatedText || "No notes generated",
        model: "google/flan-t5-large"
      }),
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ 
        error: error.message,
        tip: "Check HF_TOKEN in Netlify environment variables"
      }),
    };
  }
};
