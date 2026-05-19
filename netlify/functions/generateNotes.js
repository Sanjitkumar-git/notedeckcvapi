exports.handler = async (event) => {
  try {
    const { topic } = JSON.parse(event.body || "{}");
    
    // ✅ Updated to the new router endpoint
    const API_URL = "https://router.huggingface.co/hf-inference/models/google/flan-t5-large";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Write structured notes on: ${topic}`,
        parameters: {
          max_new_tokens: 500,      // Limits response length
          return_full_text: false,  // Prevents repeating the prompt in the output
        },
      }),
    });

    // Error handling for non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data[0]?.generated_text || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ notes: generatedText }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
