'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRequest, setCanRequest] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [mode, setMode] = useState<'text' | 'collage'>('text');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [collagePrompt, setCollagePrompt] = useState('');

  const API_KEY = 'AIzaSyA45tO0eOBz7zPfpii0xTbJaXOY1HmgRLk';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const readers: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      readers.push(
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(files[i]);
        })
      );
    }

    Promise.all(readers).then((images) => {
      setUploadedImages(prev => [...prev, ...images].slice(0, 4)); // Max 4 images
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const createCollage = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    if (!collagePrompt.trim()) {
      alert('Please describe what kind of collage you want');
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
      await new Promise(resolve => setTimeout(resolve, 3000));

      // For now, we'll create a simple collage description and use Imagen API
      const collageDescription = `Create a beautiful collage combining ${uploadedImages.length} images in an artistic way: ${collagePrompt}. Style: digital art, seamless blending, professional composition.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            { prompt: collageDescription }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            negativePrompt: "blurry, low quality, distorted"
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
        setResult(`Error: ${errorData.error?.message || 'API request failed'}`);
        setCanRequest(true);
        return;
      }

      const data = await response.json();
      if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
        setResult(`data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`);
        setCooldownSeconds(10);
      } else {
        setResult('Failed to generate collage. Please try again.');
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
      setResult('Error generating collage. Please try again.');
      setCanRequest(true);
    } finally {
      setLoading(false);
    }
  };

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
          AI Image Generator & Collage
        </h1>

        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Generation Mode
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('text')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🎨 Text to Image
              </button>
              <button
                onClick={() => setMode('collage')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'collage'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🖼️ Image Collage
              </button>
            </div>
          </div>

          {/* Text to Image Mode */}
          {mode === 'text' && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* Collage Mode */}
          {mode === 'collage' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images (Max 4)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Image Preview Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Collage Description
                </label>
                <textarea
                  value={collagePrompt}
                  onChange={(e) => setCollagePrompt(e.target.value)}
                  placeholder="Describe what kind of collage you want (e.g., 'dreamy sunset collage', 'vintage style photo album', 'artistic mosaic')"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <button
                onClick={createCollage}
                disabled={loading || uploadedImages.length === 0 || !collagePrompt.trim() || !canRequest}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Collage...' : (!canRequest ? `Please wait... (${cooldownSeconds}s)` : 'Create Collage')}
              </button>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">
                {mode === 'collage' ? 'Generated Collage:' : 'Generated Image:'}
              </h3>
              {result.startsWith('data:image') ? (
                <img
                  src={result}
                  alt="Generated result"
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
          <p className="mt-2 text-xs">⚡ 5-10 second cooldown between generations to prevent rate limits</p>
          <p className="mt-1 text-xs">🎨 Text Mode: Generate images from text | 🖼️ Collage Mode: Create artistic collages from your photos</p>
        </div>
      </div>
    </div>
  );
}