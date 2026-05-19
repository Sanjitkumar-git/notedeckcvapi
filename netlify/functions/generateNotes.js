exports.handler = async (event) => {
  try {
    const { topic } = JSON.parse(event.body || "{}");

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `Generate structured notes on: ${topic}`,
        }),
      }
    );

    const text = await hfResponse.text();

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
