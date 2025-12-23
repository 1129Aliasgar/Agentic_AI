const axios = require('axios')

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest'

/**
 * Generate a response using Ollama LLM
 * @param {string} prompt - The prompt to send to the LLM
 * @returns {Promise<string>} - The generated response
 */
// Cache model availability check
let modelChecked = false
let modelAvailable = false

const generateResponse = async (prompt) => {
  try {
    // Only check model availability once per server start (not on every request)
    if (!modelChecked) {
      await ensureModelAvailable()
      modelChecked = true
    }

    // Always use configured model (avoid probing smaller models to ensure consistency)
    const modelToUse = OLLAMA_MODEL

    // Optimize request for quality with reasonable throughput (suitable for long-form summaries)
    const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
      model: modelToUse,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: 512,
        top_k: 40,
        top_p: 0.9,
        num_ctx: 4096,
      },
    }, {
      timeout: 60000,
    })

    if (response.data && response.data.response) {
      return response.data.response.trim()
    }

    throw new Error('Invalid response from Ollama')
  } catch (error) {
    // Fallback response if Ollama is not available or times out
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404 || error.code === 'ECONNABORTED') {
      return generateFallbackResponse(prompt)
    }

    // If timeout or slow, use fallback
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return generateFallbackResponse(prompt)
    }

    throw error
  }
}

/**
 * Ensure the model is available in Ollama
 */
const ensureModelAvailable = async () => {
  try {
    // Check if Ollama is running
    await axios.get(`${OLLAMA_API_URL}/api/tags`)
    
    // Check if model exists
    const modelsResponse = await axios.get(`${OLLAMA_API_URL}/api/tags`)
    const models = modelsResponse.data.models || []

    // Try different model name formats
    const modelVariants = [
      OLLAMA_MODEL,
      OLLAMA_MODEL.replace(':latest', ''),
      'llama3.2',
      'phi3:mini',
      'phi3',
    ]

    const modelExists = models.some((model) => {
      const modelName = model.name || ''
      return modelVariants.some(variant => 
        modelName === variant || 
        modelName.startsWith(`${variant}:`) ||
        modelName.includes(variant)
      )
    })

    if (!modelExists) {
      // Try pulling different variants
      const pullVariants = ['llama3.2:latest', 'llama3.2', 'phi3:mini', 'phi3']
      
      for (const variant of pullVariants) {
        try {
          await axios.post(`${OLLAMA_API_URL}/api/pull`, {
            name: variant,
          }, {
            timeout: 300000,
          })
          break
        } catch (pullError) {
          continue
        }
      }
    }
  } catch (error) {
    // Continue anyway, might work if model is already available
  }
}

/**
 * Generate a fallback response when Ollama is not available
 */
const generateFallbackResponse = (prompt) => {
  if (prompt.includes('email') || prompt.includes('Email')) {
    return JSON.stringify({
      sorted: [
        { content: 'Sample email', priority: 'Normal' },
      ],
      scheduled: [],
    })
  }

  if (prompt.includes('summary') || prompt.includes('Summary')) {
    return 'This is a sample summary. Please ensure Ollama is running and the model is available for AI-powered summaries.'
  }

  return 'Response generated. Please ensure Ollama is running with the specified model for AI-powered features.'
}

module.exports = {
  generateResponse,
}

