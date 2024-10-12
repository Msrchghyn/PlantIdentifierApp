import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Leaf, Upload, Camera, RotateCcw } from 'lucide-react';

const genAI = new GoogleGenerativeAI("AIzaSyCVlZesOuv5EPw-56xSESjmkyXPHGumWVE");

interface PlantInfo {
  name?: string;
  scientificName?: string;
  description?: string;
  family?: string;
  origin?: string;
  uses?: string;
  careInstructions?: string;
  error?: string;
}

export default function PlantIdentifierApp() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const imageParts = [
        {
          inlineData: {
            data: await fileToBase64(file),
            mimeType: file.type,
          },
        },
      ];
      const result = await model.generateContent([
        'Identify this plant and provide its name, scientific name, brief description, family, origin, uses, and care instructions. Return the information in JSON format.',
        ...imageParts,
      ]);
      const response = await result.response;
      const text = response.text();
      console.log('API Response:', text);

      try {
        const parsedInfo = JSON.parse(text);
        setPlantInfo(parsedInfo);
      } catch (jsonError) {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonString = jsonMatch[1].trim();
          const parsedInfo = JSON.parse(jsonString);
          setPlantInfo(parsedInfo);
        } else {
          setPlantInfo({
            name: "Unknown",
            scientificName: "Not available",
            description: text,
          });
        }
      }
    } catch (error) {
      console.error('Error identifying plant:', error);
      setPlantInfo({ error: `Failed to identify plant: ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64WithoutPrefix = base64String.split(',')[1];
        resolve(base64WithoutPrefix);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadAnotherImage = () => {
    setPreviewUrl(null);
    setPlantInfo(null);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    stopCamera();
    startCamera();
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasRef.current.toBlob(blob => {
          if (blob) {
            const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
            handleImageUpload(file);
          }
        }, 'image/jpeg');
      }
    }
    stopCamera();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-green-50">
      <header className="text-center mb-4">
        <h1 className="text-2xl md:text-4xl font-bold text-green-800 mb-2 flex items-center justify-center">
          <Leaf className="mr-2" /> Plant Identifier
        </h1>
        <p className="text-green-600 text-sm md:text-base">Upload an image or take a photo to identify and learn about plants!</p>
      </header>

      {!previewUrl && !plantInfo && !isCameraActive && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full sm:w-1/2 h-32 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-300"
            >
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 mb-2 text-green-400" />
                <p className="text-sm text-green-600">
                  <span className="font-semibold">Upload Image</span>
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                className="hidden"
                disabled={isLoading}
              />
            </label>
            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center w-full sm:w-1/2 h-32 border-2 border-green-300 border-dashed rounded-lg cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-300"
            >
              <Camera className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm text-green-600">
                <span className="font-semibold">Take a Photo</span>
              </p>
            </button>
          </div>
          <p className="text-xs text-center mt-2 text-gray-500">
            Acceptable image types: PNG, JPG, GIF. Recommended size: up to 800x400px
          </p>
        </div>
      )}

      {isCameraActive && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 text-sm"
              >
                Capture
              </button>
              <button
                onClick={switchCamera}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-sm"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-2 text-green-600">Identifying plant...</p>
        </div>
      )}

      {previewUrl && plantInfo && !isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <img
            src={previewUrl}
            alt="Uploaded plant"
            className="w-auto h-80 mx-auto rounded-lg shadow-md mb-4"
          />
          <h2 className="text-xl md:text-2xl font-bold text-green-800 mb-2">{plantInfo.name || 'Unknown Plant'}</h2>
          <p className="italic text-green-600 mb-2">{plantInfo.scientificName}</p>
          <p className="text-gray-700 mb-2">{plantInfo.description}</p>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4 font-semibold">Family:</td>
                <td className="py-2">{plantInfo.family || 'Unknown'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-semibold">Origin:</td>
                <td className="py-2">{plantInfo.origin || 'Unknown'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-semibold">Uses:</td>
                <td className="py-2">{plantInfo.uses || 'Unknown'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold">Care:</td>
                <td className="py-2">{plantInfo.careInstructions || 'Unknown'}</td>
              </tr>
            </tbody>
          </table>
          <button
            onClick={handleUploadAnotherImage}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
          >
            Upload Another Image
          </button>
        </div>
      )}

      {plantInfo?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{plantInfo.error}</span>
        </div>
      )}
    </div>
  );
}
