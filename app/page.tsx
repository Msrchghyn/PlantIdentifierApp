// app/page.tsx
'use client'

import { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import PlantInfo from './components/PlantInfo'

export default function Home() {
  const [plantInfo, setPlantInfo] = useState<any>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <ImageUpload setPlantInfo={setPlantInfo} />
        {plantInfo && <PlantInfo plantInfo={plantInfo} />}
      </div>
    </main>
  )
}