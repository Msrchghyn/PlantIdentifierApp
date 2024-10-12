export default function PlantInfo({ plantInfo }: { plantInfo: any }){
  if (plantInfo.error){
    return <p className="text-red-500">{plantInfo.error}</p>
  }

  return(
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-semibold text-green-600 mb-4">{plantInfo.name}</h2>
      <p className="text-gray-600 italic mb-4">{plantInfo.scientificName}</p>
      <p className="text-gray-800">{plantInfo.description}</p>
    </div>
  )
}