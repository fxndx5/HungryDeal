// LoadingSkeleton — placeholders animados mientras cargamos datos
//
// Usamos skeleton loading en lugar de spinners porque da una mejor
// experiencia visual: el usuario ya sabe el tamaño del contenido que viene.

// Skeleton para una tarjeta de restaurante (página /search)
export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div className="skeleton h-5 w-2/3 rounded-lg" />
      <div className="skeleton h-4 w-1/2 rounded-lg" />
      <div className="flex gap-2 mt-2">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

// Skeleton para una tarjeta de precio (página /compare)
export function PriceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex justify-between">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-28 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-full rounded" />
      </div>
      <div className="border-t pt-3">
        <div className="skeleton h-8 w-28 rounded ml-auto" />
      </div>
      <div className="skeleton h-10 w-full rounded-xl" />
    </div>
  )
}
