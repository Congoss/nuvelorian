export const TOASTER_TIMINGS = { popping: 1220, rise: 220, spin: 740, fall: 260, hiding: 440, hiddenMin: 30000, hiddenMax: 60000 };
const clamp = value => Math.max(0, Math.min(1, value));
export const newToasterAnimation = () => ({ phase: 'popping', elapsed: 0, duration: TOASTER_TIMINGS.popping });
function nextPhase(phase, random) {
  if (phase === 'popping' || phase === 'hiding') return { phase: 'hidden', elapsed: 0, duration: TOASTER_TIMINGS.hiddenMin + random() * (TOASTER_TIMINGS.hiddenMax - TOASTER_TIMINGS.hiddenMin) };
  return newToasterAnimation();
}
export function advanceToasterAnimation(state, milliseconds, random = Math.random) {
  let next = { ...state, elapsed: state.elapsed + Math.max(0, milliseconds) };
  while (next.elapsed >= next.duration) {
    const remainder = next.elapsed - next.duration;
    next = { ...nextPhase(next.phase, random), elapsed: remainder };
  }
  return next;
}
export function hideToasterBread(state) {
  if (['hidden', 'hiding'].includes(state.phase)) return state;
  const pose = toasterBreadPose(state);
  return { phase: 'hiding', elapsed: 0, duration: TOASTER_TIMINGS.hiding, startY: pose.y, startRotation: pose.rotation, startHeat: pose.heat, startLever: pose.lever };
}
export function toasterBreadPose(state) {
  const p = clamp(state.elapsed / state.duration);
  if (state.phase === 'hidden') return { y: 100, rotation: 0, heat: 1, lever: 1, recoil: 0 };
  if (state.phase === 'hiding') return { y: (state.startY || 0) + (100 - (state.startY || 0)) * p * p, rotation: (state.startRotation || 0) + (360 - (state.startRotation || 0)) * p, heat: (state.startHeat || 0) + (1 - (state.startHeat || 0)) * p, lever: (state.startLever || 0) + (1 - (state.startLever || 0)) * p, recoil: 0 };
  // Quick spring launch, readable airborne turn, then a brisk accelerating drop.
  const ms = p * TOASTER_TIMINGS.popping;
  const rise = clamp(ms / TOASTER_TIMINGS.rise);
  const spin = clamp((ms - TOASTER_TIMINGS.rise) / TOASTER_TIMINGS.spin);
  const fall = clamp((ms - TOASTER_TIMINGS.rise - TOASTER_TIMINGS.spin) / TOASTER_TIMINGS.fall);
  const y = ms < TOASTER_TIMINGS.rise
    ? 100 - 165 * (1 - Math.pow(1 - rise, 3))
    : ms < TOASTER_TIMINGS.rise + TOASTER_TIMINGS.spin
      ? -65 - 4 * Math.sin(spin * Math.PI)
      : -65 + 165 * fall * fall;
  const heat = ms < 80 ? 1 - ms / 80 : fall > .65 ? (fall - .65) / .35 : 0;
  const recoil = ms < 110 ? Math.sin(ms / 110 * Math.PI) * 5 : fall > .65 ? Math.sin((fall - .65) / .35 * Math.PI) * 3 : 0;
  return { y, rotation: 360 * spin * spin * (3 - 2 * spin), tilt: Math.sin(spin * Math.PI * 2) * 7, heat, lever: heat, recoil };
}
