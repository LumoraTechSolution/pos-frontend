'use client';

/**
 * POS Terminal page — placeholder for Step 7 (POS UI implementation).
 * Will contain: product grid, cart panel, payment screen, quick actions.
 */
export default function TerminalPage() {
  return (
    <div className="h-screen flex">
      {/* Left Side — Product Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold">
            Lumora<span className="text-indigo-400"> POS</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Terminal #1
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <input
            type="text"
            placeholder="Search products by name, SKU, or scan barcode..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Product Grid Placeholder */}
        <div className="flex-1 p-4 pt-0 overflow-auto">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 hover:bg-gray-800 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-800 animate-pulse" />
                <div className="h-3 w-20 rounded bg-gray-800 animate-pulse" />
                <div className="h-3 w-14 rounded bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side — Cart Panel */}
      <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* Cart Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6">
          <h2 className="font-semibold text-lg">Current Sale</h2>
          <span className="ml-auto text-sm text-gray-500">0 items</span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <p className="text-sm">No items in cart</p>
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-800 p-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-indigo-400">$0.00</span>
          </div>
          <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-lg shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 active:scale-[0.98]">
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}
