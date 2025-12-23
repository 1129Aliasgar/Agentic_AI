import { useState } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import { docApi } from '../api/docApi'

export default function DocPage() {
  const { addNotification } = useNotification()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setSummary(null)
  }

  const handleUpload = async () => {
    if (!file) {
      addNotification('Please select a file', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await docApi.summarize(file)
      
      if (response.success) {
        setSummary(response.summary || null)
        addNotification('Document summarized successfully!', 'success')
      } else {
        addNotification(response.error || 'Failed to summarize document', 'error')
      }
    } catch (error: any) {
      console.error('Error summarizing document:', error)
      const errorMessage = error.error || error.message || 'Failed to summarize document. Please try again.'
      addNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-500 mb-6">Document Summary</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Upload a document (PDF, DOC, DOCX, TXT):
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="w-full bg-gray-800 text-white border border-purple-500/30 rounded-lg p-4 mb-4 focus:outline-none focus:border-purple-500"
          />
          {file && (
            <p className="text-sm text-gray-400 mb-4">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Generate Summary'}
          </button>
        </div>

        {summary && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Summary</h2>
            <div className="bg-gray-800 p-6 rounded-lg">
              <p className="text-white whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

