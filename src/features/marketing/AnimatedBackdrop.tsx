/** Shifting indigo gradient with a slowly pulsing orange glow. Decorative; place inside a `relative isolate` section. */
export default function AnimatedBackdrop() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="aurora absolute inset-0" />
      <div className="animate-glow-pulse absolute -right-40 top-10 h-140 w-140 rounded-full bg-[#f39a2e]/20 blur-3xl sm:bg-[#f39a2e]/35" />
      <div className="animate-glow-pulse absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#f39a2e]/20 blur-3xl [animation-delay:-3s]" />
      <div className="animate-drift absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />
    </div>
  );
}
