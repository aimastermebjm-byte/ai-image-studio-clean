'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRequest, setCanRequest] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const API_KEY = 'AIzaSyDwqr_Ayx05UVQZExxCaq1PVBU8OzHvFss';

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (!canRequest) {
      alert('Please wait before making another request');
      return;
    }

    setLoading(true);
    setResult('');
    setCanRequest(false);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            { prompt: prompt }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1"
          }
        }),
      });

      if (response.status === 429) {
        setResult('Rate limit exceeded. Please wait 60 seconds before trying again.');
        setCooldownSeconds(60);
        const countdown = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(countdown);
              setCanRequest(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setResult(`Gemini Error: ${errorData.error?.message || 'API request failed'}`);
        setCanRequest(true);
        return;
      }

      const data = await response.json();
      if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
        setResult(`data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`);
        setCooldownSeconds(5);
      } else {
        setResult('No image generated. Please try a different prompt.');
        setCanRequest(true);
      }

      const countdown = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setCanRequest(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error generating image. Please try again.');
      setCanRequest(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          AI Image Generator
        </h1>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !canRequest}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : (!canRequest ? `Please wait... (${cooldownSeconds}s)` : 'Generate Image')}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Generated Image:</h3>
              {result.startsWith('data:image') ? (
                <img
                  src={result}
                  alt="Generated image"
                  className="w-full rounded-md shadow-md"
                />
              ) : (
                <p className="text-gray-700">{result}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by Google Imagen 4.0</p>
          <p className="mt-2 text-xs">⚡ 5 second cooldown between generations to prevent rate limits</p>
        </div>
      </div>
    </div>
  );
}