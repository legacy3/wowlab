# Spec Coverage

The [spec coverage tool](/lab/spec-coverage) shows which spells are currently supported by the simulator for each class and specialization.

## When to use it

Use this tool if you want to check whether your spec is ready for simulation. It helps you understand what abilities the simulator can handle before you spend time writing rotations or running sims.

## How it works

The tool queries spell data for every specialization in the game and compares it against the spells the simulator knows how to process. The data is generated dynamically from the current patch, so it stays up to date as new spells are added.

## What you see

After loading, the tool shows:

- **Overall coverage** - The percentage of spells supported across all specs
- **Per-class breakdown** - Coverage ranked by class
- **Coverage matrix** - A visual grid of every spec, color-coded by coverage level

Click any spec in the matrix to see the full list of supported and missing spells.

## Coverage levels

The matrix uses color coding to indicate coverage:

| Color       | Coverage |
| ----------- | -------- |
| Red         | 0-30%    |
| Orange      | 30-50%   |
| Yellow      | 50-70%   |
| Light green | 70-90%   |
| Green       | 90%+     |

## Loading time

Loading takes about 60 seconds because the tool fetches spell data for every spec before displaying results. Once loaded, it stays cached for your session.

## Interpreting results

High coverage means most of the spec's abilities are implemented. Low coverage means the spec may not simulate accurately yet.

Keep in mind that coverage percentage alone doesn't tell the whole story. A spec might have high coverage but still be missing a key rotational ability.
