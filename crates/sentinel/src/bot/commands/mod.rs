mod wlab;

use super::{Data, Error};

pub fn all() -> Vec<poise::Command<Data, Error>> {
    vec![wlab::wlab()]
}
