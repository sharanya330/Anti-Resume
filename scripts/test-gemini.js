const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Load env manually
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

console.log('Testing Gemini API...');
console.log('API Key found:', apiKey ? 'Yes (' + apiKey.substring(0, 5) + '...)' : 'No');

if (!apiKey) {
    console.error('No API key found in .env.local');
    process.exit(1);
}

async function test() {
    try {
        console.log('Trying gemini-flash-latest...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = 'Say "Hello from Gemini" if you can hear me.';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Success with gemini-pro! Response:', text);
    } catch (error) {
        console.error('gemini-pro failed:', error.message);

        try {
            console.log('Trying gemini-1.5-flash-latest...');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
            const result = await model.generateContent('Hello');
            console.log('Success with gemini-1.5-flash-latest!', result.response.text());
        } catch (e) {
            console.error('gemini-1.5-flash-latest failed:', e.message);
        }
    }
}

test();
