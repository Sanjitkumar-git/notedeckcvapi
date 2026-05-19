exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No body received" }),
      };
    }

    const { topic } = JSON.parse(event.body);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Generate structured study notes on: ${topic}`,
        }),
      }
    );

    const data = await response.json().catch(async () => {
      return await response.text();
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        notes:
          data?.[0]?.generated_text ||
          data?.generated_text ||
          data,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
