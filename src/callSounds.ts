/** Local call cues. No network, credentials or provider credits are required. */
export function createCallSounds() {
 let context: AudioContext | null = null
 let ringing: ReturnType<typeof setInterval> | null = null
 const active = new Set<OscillatorNode>()
 function unlock() {
  try {
   const Audio = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext
   if (!context && Audio) context = new Audio()
   if (context?.state === 'suspended') void context.resume().catch(() => {})
  } catch { /* Audio availability never blocks a call. */ }
 }
 function silence() {
  if (ringing) clearInterval(ringing)
  ringing = null
  for (const node of active) { try { node.stop() } catch { /* Already ended. */ } }
  active.clear()
 }
 function tone(frequency: number, delay: number, duration: number) {
  if (!context || context.state !== 'running') return
  try {
   const node = context.createOscillator(), gain = context.createGain(), start = context.currentTime + delay
   node.type = 'sine'; node.frequency.value = frequency
   gain.gain.setValueAtTime(0, start)
   gain.gain.linearRampToValueAtTime(0.06, start + 0.015)
   gain.gain.setValueAtTime(0.06, start + duration - 0.025)
   gain.gain.linearRampToValueAtTime(0, start + duration)
   node.connect(gain); gain.connect(context.destination); active.add(node)
   node.onended = () => { active.delete(node); node.disconnect(); gain.disconnect() }
   node.start(start); node.stop(start + duration)
  } catch { /* Continue without sound on unsupported devices. */ }
 }
 return {
  ring() { silence(); unlock(); const pulse = () => { tone(440, 0, .22); tone(520, .28, .22) }; pulse(); ringing = setInterval(pulse, 1500) },
  connected() { silence(); tone(660, 0, .1); tone(880, .12, .14) },
  disconnected() { silence(); tone(520, 0, .12); tone(350, .14, .18) },
  silence,
  dispose() { silence(); if (context) void context.close().catch(() => {}); context = null },
 }
}
