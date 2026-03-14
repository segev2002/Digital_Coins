import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-black gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-700 border-t-white animate-spin" />
          <span className="text-neutral-400 text-sm tracking-widest uppercase">Loading 3D scene…</span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
