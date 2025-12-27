#[repr(C)]
pub struct SimState {
    pub focus: f32,
    pub frenzy_stacks: i32,
    pub frenzy_remaining: f32,
    pub kill_command_charges: i32,
    pub barbed_shot_charges: i32,
}

#[no_mangle]
pub extern "C" fn rotation(
    focus: f32,
    frenzy_stacks: i32,
    frenzy_remaining: f32,
    kill_command_charges: i32,
    barbed_shot_charges: i32,
) -> i32 {
    if barbed_shot_charges > 0 && frenzy_remaining < 2.0 && frenzy_stacks > 0 {
        return 217200;
    }
    if kill_command_charges > 0 && focus >= 30.0 {
        return 34026;
    }
    if barbed_shot_charges > 0 {
        return 217200;
    }
    if focus >= 35.0 {
        return 193455;
    }
    0
}
