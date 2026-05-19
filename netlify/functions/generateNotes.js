const hfResponse = await fetch(
  "https://api-inference.huggingface.co/models/google/flan-t5-large",
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

// IMPORTANT: read ONLY ONCE
const rawText = await hfResponse.text();

let data;
try {
  data = JSON.parse(rawText);
} catch (e) {
  data = rawText;
}

return {
  statusCode: 200,
  body: JSON.stringify({
    notes: data?.[0]?.generated_text || data,
  }),
};
