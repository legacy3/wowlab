// Beast Mastery Hunter - Single Target Rotation

// Cooldowns (off-GCD)
if bestial_wrath.ready() { cast("bestial_wrath") }

// On-GCD cooldowns
if call_of_the_wild.ready() { cast("call_of_the_wild") }
if bloodshed.ready() { cast("bloodshed") }

// Core rotation
if kill_command.ready() { cast("kill_command") }
if barbed_shot.ready() { cast("barbed_shot") }

// Execute
if kill_shot.ready() { cast("kill_shot") }

// Fillers
if cobra_shot.ready() { cast("cobra_shot") }
if multi_shot.ready() { cast("multi_shot") }
