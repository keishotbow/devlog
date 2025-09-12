import OpenAI from "openai";
const client = new OpenAI();

const response = await client.responses.create({
    model: "gpt-5-nano",
    input: "はじめてgpt-5-nanoを利用します。gptを利用して何ができるか具体的に教えてください。",
});

console.log(response.output_text);