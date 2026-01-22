mod general;
mod info;

use crate::{Data, Error};

pub fn all() -> Vec<poise::Command<Data, Error>> {
    vec![
        general::ping(),
        general::echo(),
        info::help(),
        info::about(),
        info::serverinfo(),
    ]
}
