const llmAgent = require('../agents/llmAgent')
const pdfParser = require('../utils/pdfParser')

const summarizeDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const file = req.file
    let textContent = ''

    // Parse document based on file type
    const fileExtension = file.originalname.split('.').pop().toLowerCase()

    try {
      if (fileExtension === 'pdf') {
        textContent = await pdfParser.parsePDF(file.buffer)
      } else if (fileExtension === 'txt') {
        textContent = file.buffer.toString('utf-8')
      } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        textContent = await pdfParser.parseDOC(file.buffer)
      } else {
        return res.status(400).json({
          success: false,
          error: 'Unsupported file type',
        })
      }
    } catch (parseError) {
      console.error('Error parsing document:', parseError)
      return res.status(500).json({
        success: false,
        error: 'Failed to parse document',
      })
    }

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Document appears to be empty or could not be parsed',
      })
    }

    // Helper: chunk large content (aim ~6000 chars per chunk to fit model context comfortably)
    const chunkText = (text, maxLen = 6000) => {
      const chunks = []
      let start = 0
      while (start < text.length) {
        let end = Math.min(start + maxLen, text.length)
        // try to break on a paragraph or sentence boundary
        const boundary = text.lastIndexOf('\n\n', end)
        const period = text.lastIndexOf('. ', end)
        if (boundary > start + 1000) end = boundary
        else if (period > start + 1000) end = period + 1
        chunks.push(text.slice(start, end))
        start = end
      }
      return chunks
    }

    // Try to extract abstract if present
    const abstractMatch = textContent.match(/\babstract\b\s*[:\-]?\s*([\s\S]*?)(\n\n|\r\n\r\n|\n\r\n\r|\n\s*keywords\b|\n\s*introduction\b)/i)
    const abstractText = abstractMatch ? abstractMatch[1].trim() : ''

    const chunks = chunkText(textContent)

    // Map step: summarize each chunk
    const chunkSummaries = []
    for (let i = 0; i < chunks.length; i++) {
      const mapPrompt = `You are an expert scientific reader. Summarize the following section of a paper.
Focus on: objectives, methods, key results, limitations, and important terms.
Write 5-8 bullet points. Keep it faithful to the text.

SECTION ${i + 1}/${chunks.length}:
${chunks[i]}`
      const resp = await llmAgent.generateResponse(mapPrompt)
      chunkSummaries.push(`Section ${i + 1}:\n${resp}`)
    }

    // Reduce step: consolidate into a reader-friendly paper summary
    const reducePrompt = `You are an expert at summarizing scientific papers for busy readers.
Use the provided section summaries${abstractText ? ' and abstract' : ''} to produce a structured, comprehensive summary.
Include these sections:
- Title (if present in text; otherwise omit)
- Abstract (2-4 sentences)
- Objectives
- Methods
- Key Findings (bulleted)
- Limitations
- Conclusion
- TL;DR (1-2 sentences)

Abstract:
${abstractText || '(not explicitly provided)'}

Section Summaries:
${chunkSummaries.join('\n\n')}

Return clear paragraphs and bullets. Avoid speculation; use only what is supported by the text.`

    const finalSummary = await llmAgent.generateResponse(reducePrompt)

    res.json({
      success: true,
      summary: finalSummary,
    })
  } catch (error) {
    console.error('Error summarizing document:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize document',
    })
  }
}

module.exports = {
  summarizeDocument,
}

