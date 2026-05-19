exports.handler = async (event) => {
  try {
    const { topic } = JSON.parse(event.body || "{}");

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Write structured notes on: ${topic}`,
        }),
      }
    );

    const text = await response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        notes: text,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};
