import OpenAI from 'openai';

const configuration = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { configuration };