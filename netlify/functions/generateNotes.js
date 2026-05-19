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
    
    const MODEL = "google/flan-t5-large";
    // Using the direct standard Inference API URL
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
    
    console.log("📝 Topic:", topic);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Write structured notes on ${topic}:`,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.5,
          return_full_text: false // Don't repeat the prompt in the output
        },
      }),
    });

    console.log("📡 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Detail:", errorText); // This will print exactly why HF said 400
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Response:", JSON.stringify(data).substring(0, 100));
    
    // Handling array response which HF standard inference returns
    const notes = data[0]?.generated_text || data.generated_text || "No notes generated";

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
