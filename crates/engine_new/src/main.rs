use engine_new::cli::{Args, Runner};
use clap::Parser;

fn main() {
    let args = Args::parse();

    if let Err(e) = Runner::run(args) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
