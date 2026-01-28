// BM Hunter Priority Rotation
if $cooldown.bestial_wrath.ready() {
    cast($spell.bestial_wrath)
} else if $cooldown.kill_command.ready() && $power.focus >= 30.0 {
    cast($spell.kill_command)
} else if $cooldown.barbed_shot.has_charge() {
    cast($spell.barbed_shot)
} else if $power.focus >= 35.0 {
    cast($spell.cobra_shot)
} else {
    wait_gcd()
}
