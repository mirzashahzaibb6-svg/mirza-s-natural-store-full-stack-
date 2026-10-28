import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <h1 className="text-7xl">Lost in the bazaar</h1>
        <p className="mt-4 text-mute">We could not find that page.</p>
        <Link href="/shop" className="mt-8 inline-block rounded-full border border-brass px-8 py-3 font-semibold">Back to the shop</Link>
      </div>
    </div>
  );
}
