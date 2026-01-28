// MM Hunter Priority Rotation
// Priority: Trueshot > Aimed Shot > Rapid Fire > Arcane Shot (with Precise Shots) > Steady Shot

// Use Trueshot on cooldown (major CD)
if $cooldown.trueshot.ready() {
    cast($spell.trueshot)
}
// Aimed Shot on cooldown (primary damage)
else if $cooldown.aimed_shot.ready() && $power.focus >= 35.0 {
    cast($spell.aimed_shot)
}
// Rapid Fire on cooldown
else if $cooldown.rapid_fire.ready() {
    cast($spell.rapid_fire)
}
// Arcane Shot to consume Precise Shots
else if $aura.precise_shots.active() && $power.focus >= 20.0 {
    cast($spell.arcane_shot)
}
// Kill Shot in execute range
else if $target.health_pct < 0.20 && $cooldown.kill_shot.ready() && $power.focus >= 10.0 {
    cast($spell.kill_shot)
}
// Steady Shot to generate Focus and maintain Steady Focus
else if $power.focus < 70.0 {
    cast($spell.steady_shot)
}
// Arcane Shot as filler when high on Focus
else if $power.focus >= 60.0 {
    cast($spell.arcane_shot)
}
// Default: Steady Shot
else {
    cast($spell.steady_shot)
}
