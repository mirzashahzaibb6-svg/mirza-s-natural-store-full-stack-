'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <h1 className="text-6xl">Something went wrong</h1>
        <p className="mt-4 text-mute">The page crashed unexpectedly. Your data is safe.</p>
        <Button className="mt-8" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
