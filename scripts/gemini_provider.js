#!/usr/bin/env node

const { GoogleGenerativeAI } = require('@google/generative-ai')

function _initModel(model, systemPrompt, generationConfig) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in environment')
  }

  const genai = new GoogleGenerativeAI(apiKey)

  const modelConfig = { model, generationConfig }
  if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim().length > 0) {
    modelConfig.systemInstruction = systemPrompt
  }

  return genai.getGenerativeModel(modelConfig)
}

async function generateText(model, systemPrompt, userPrompt, options = {}) {
  const temperature = options.temperature ?? 0.3
  const maxOutputTokens = options.maxOutputTokens ?? 8192

  console.log(`\n🌟 Invoking Gemini Worker (${model})...\n`)

  const geminiModel = _initModel(model, systemPrompt, { temperature, maxOutputTokens })

  const result = await geminiModel.generateContentStream(userPrompt)

  let fullText = ''
  for await (const chunk of result.stream) {
    const chunkText = chunk.text()
    process.stdout.write(chunkText)
    fullText += chunkText
  }
  console.log('\n')

  if (!fullText) {
    throw new Error(`Gemini returned empty response for model: ${model}`)
  }

  return fullText
}

async function generateJSON(model, systemPrompt, userPrompt, options = {}) {
  const temperature = options.temperature ?? 0.3
  const maxOutputTokens = options.maxOutputTokens ?? 8192

  console.log(`\n🌟 Invoking Gemini Worker (${model})...\n`)

  const geminiModel = _initModel(model, systemPrompt, {
    temperature,
    maxOutputTokens,
    // responseMimeType forces the model to emit valid JSON — avoids markdown fences wrapping the output
    responseMimeType: 'application/json',
  })

  const result = await geminiModel.generateContent(userPrompt)

  const fullText = result.response.text()

  if (!fullText) {
    throw new Error(`Gemini returned empty response for model: ${model}`)
  }

  try {
    return JSON.parse(fullText)
  } catch (err) {
    throw new Error(`Gemini JSON parse failed for model ${model}: ${err.message}\nRaw: ${fullText.slice(0, 200)}`)
  }
}

module.exports = { generateText, generateJSON }
