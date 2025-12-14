## What it is

WoW Lab is a free, open-source World of Warcraft simulation toolkit. It lets you test rotations, compare gear, and theorycraft without waiting in queues. The entire simulation runs in your browser so you can iterate quickly.

## How it works

When you hit simulate, the engine runs locally in your browser. It processes combat events the same way the game does: applying spells, tracking buffs, calculating damage over time. Spell data, item stats, and mechanics live in a database; your browser keeps a small cache so lookups stay fast. Rotations are plain JavaScript that you can edit directly on the site.

## Open source

Everything is on [GitHub](https://github.com/legacy3/wowlab). You can inspect how calculations work, report bugs, or contribute. WoW Lab is free and aims to stay that way; because sims run on your machine, hosting costs stay minimal.

## Credits

WoW Lab stands on the shoulders of giants: [SimulationCraft](https://www.simulationcraft.org/) decoded WoW data and mechanics; we reuse their addon for gear imports. [wago.tools](https://wago.tools) provides spell and item data. The simulation engine is built with [Effect](https://effect.website). Thanks to everyone in the WoW theorycrafting community who shares knowledge and makes tools like this possible.

## Questions or feedback

Open an issue on our [GitHub repo](https://github.com/legacy3/wowlab/issues).
