import { useState } from 'react'
import { generate, getDebugBundle } from './api'
import type { GenerateResponse, DebugBundle } from './api'

function App() {
  // State management
  const [prompt, setPrompt] = useState('Say hello in one sentence.')
  const [model, setModel] = useState('gpt-4o-mini')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(100)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<GenerateResponse | null>(null)
  const [bundle, setBundle] = useState<DebugBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [injectDate, setInjectDate] = useState(false)

  // Handle Generate button click
  const handleGenerate = async () => {
    setError(null)
    setIsLoading(true)

    try {
      let finalPrompt = prompt
      if (injectDate) {
        const today = new Date().toISOString().slice(0, 10)
        finalPrompt = `Today is ${today}. ${prompt}`
      }

      const response = await generate({ prompt: finalPrompt, model, temperature, maxTokens })
      setResult(response)

      // Auto-fetch bundle for better UX
      if (response.id) {
        try {
          const debugBundle = await getDebugBundle(response.id)
          setBundle(debugBundle)
        } catch (bundleErr) {
          const msg = bundleErr instanceof Error ? bundleErr.message : String(bundleErr)
          setError(`Auto-fetch bundle failed: ${msg}`)
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Fetch Debug Bundle button click
  const handleFetchBundle = async () => {
    if (!result?.id) {
      setError('No result ID available. Generate a response first.')
      return
    }

    try {
      const debugBundle = await getDebugBundle(result.id)
      setBundle(debugBundle)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch bundle'
      setError(errorMsg)
    }
  }

  // Handle copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show brief success feedback
      alert(`${label} copied to clipboard!`)
    }).catch(() => {
      setError(`Failed to copy ${label}`)
    })
  }

  return (
    <div className="container">
      <h1>LLM Repro Trace Kit</h1>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Form Inputs */}
      <div className="card">
        <h2>Generate Response</h2>
        <div className="form-group">
          <label htmlFor="prompt">Prompt:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            disabled={isLoading}
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="model">Model:</label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature:</label>
            <input
              id="temperature"
              type="number"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              min="0"
              max="2"
              step="0.1"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxTokens">Max Tokens:</label>
            <input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              min="1"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label htmlFor="injectDate">
            <input
              id="injectDate"
              type="checkbox"
              checked={injectDate}
              onChange={(e) => setInjectDate(e.target.checked)}
              disabled={isLoading}
            />
            <span>Inject current date into prompt</span>
          </label>
          <p className="checkbox-hint">
            OFF: LLM may hallucinate dates | ON: Provides context
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="primary"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Result Panel */}
      {result && (
        <div className="card card--result">
          <h2>Result</h2>
          <div className="result-grid">
            <div className="result-item">
              <strong>Bundle ID:</strong>
              <code>{result.id}</code>
              <button 
                onClick={() => copyToClipboard(result.id, 'Bundle ID')}
                className="copy-btn"
              >
                Copy
              </button>
            </div>
            <div className="result-item">
              <strong>Request ID:</strong>
              <code>{result.requestId}</code>
              <button 
                onClick={() => copyToClipboard(result.requestId, 'Request ID')}
                className="copy-btn"
              >
                Copy
              </button>
            </div>
            <div className="result-item">
              <strong>Latency:</strong>
              <code>{result.latencyMs}ms</code>
            </div>
          </div>

          <div className="result-item full-width">
            <strong>Output:</strong>
            <pre>{result.output}</pre>
          </div>

          <div className="result-item full-width">
            <strong>Raw JSON:</strong>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>

          {result.error && (
            <div className="result-item full-width error">
              <strong>Error:</strong>
              <pre>{JSON.stringify(result.error, null, 2)}</pre>
            </div>
          )}

          <button onClick={handleFetchBundle} className="secondary">
            Fetch Debug Bundle
          </button>
        </div>
      )}

      {/* Bundle Panel */}
      {bundle && (
        <div className="card card--bundle">
          <h2>Debug Bundle</h2>
          <div className="result-item full-width">
            <strong>Bundle Data:</strong>
            <pre>{JSON.stringify(bundle, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
