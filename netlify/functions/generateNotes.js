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
    
    // ✅ Aapka chosen model
    const MODEL = "Qwen/Qwen2-1.5B-Instruct";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL}`;
    
    console.log("📝 Generating notes for:", topic);
    console.log("🤖 Using model:", MODEL);
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `[INST] Write detailed, structured notes on the topic: ${topic}. Include key points, definitions, and examples. [/INST]`,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
        },
      }),
    });

    // Agar model loading ho raha hai toh wait karo
    if (response.status === 503) {
      const errorData = await response.json();
      if (errorData.error?.includes("loading")) {
        return {
          statusCode: 202,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ 
            message: "Model is loading, please try again in 10 seconds",
            estimated_time: errorData.estimated_time 
          })
        };
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`Hugging Face API Error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    
    // Qwen ka response format handle karo
    let notes = "";
    if (data[0]?.generated_text) {
      notes = data[0].generated_text;
    } else if (data.generated_text) {
      notes = data.generated_text;
    } else {
      notes = JSON.stringify(data);
    }
    
    // Prompt ko remove karo sirf notes rakho
    notes = notes.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        notes: notes || "No notes generated",
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
