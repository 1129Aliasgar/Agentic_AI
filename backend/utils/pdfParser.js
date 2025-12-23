const pdf = require('pdf-parse')
const mammoth = require('mammoth')

/**
 * Parse PDF buffer and extract text
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
const parsePDF = async (buffer) => {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Failed to parse PDF file')
  }
}

/**
 * Parse DOC/DOCX buffer and extract text
 * @param {Buffer} buffer - DOC/DOCX file buffer
 * @returns {Promise<string>} - Extracted text content
 */
const parseDOC = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer })
    return result.value
  } catch (error) {
    console.error('Error parsing DOC/DOCX:', error)
    throw new Error('Failed to parse DOC/DOCX file')
  }
}

module.exports = {
  parsePDF,
  parseDOC,
}

