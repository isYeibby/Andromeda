export default function ScanlineOverlay() {
  return (
    <div className="scanlines pointer-events-none fixed inset-0 z-[9998]" aria-hidden="true">
      {/* Subtle animated scan beam */}
      <div
        className="absolute w-full h-[2px] opacity-[0.04] animate-scan"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), transparent)',
        }}
      />
    </div>
  );
}
