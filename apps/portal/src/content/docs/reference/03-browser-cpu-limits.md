---
title: Browser CPU Limits
description: Why browsers report different CPU core counts and how it affects web workers
updatedAt: 2025-12-26
---

# Browser CPU Limits

Your browser might report fewer CPU cores than you actually have. This affects how many web workers run in parallel for simulations.

## TL;DR

We use this formula to pick worker count:

```js
Math.min(4, Math.ceil((navigator.hardwareConcurrency || 1) / 2));
```

This is conservative. If you want more parallelism, override it in [account settings](/account/settings).

### Browser limits

Not all browsers report your real core count:

| Browser        | Core Limit                |
| -------------- | ------------------------- |
| Chrome         | No limit (reports actual) |
| Firefox        | May cap at 16             |
| Safari (macOS) | Capped at 8               |
| Safari (iOS)   | Capped at 2               |
| Brave          | Randomized (2 to actual)  |

For max reported cores, use Chrome or Edge.

## Override in settings

You can set a fixed worker count in [account settings](/account/settings). Enable the override toggle and pick a value from 1-32.

This syncs with your account, not your device. If you use multiple machines with different hardware, you may want to leave it off.

## Why browsers limit cores

Browsers limit [`navigator.hardwareConcurrency`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency) for fingerprinting protection. Your exact core count is one signal trackers use to identify you across websites.

The [WHATWG spec](https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency) explicitly allows this:

> User agents should err toward exposing the number of logical processors available, using lower values only in cases where there are user-agent specific limits in place or when the user agent desires to limit fingerprinting possibilities.

## Browser specifics

**Firefox** can cap at 16 cores depending on version and settings. With [`privacy.resistFingerprinting`](https://support.mozilla.org/en-US/kb/firefox-protection-against-fingerprinting) enabled, it drops to 2.

- [Bug 1728741: hardwareConcurrency capped at 16](https://bugzilla.mozilla.org/show_bug.cgi?id=1728741)
- [Bug 1360039: Spoof hardwareConcurrency with resistFingerprinting](https://bugzilla.mozilla.org/show_bug.cgi?id=1360039)

**Safari** caps at 8 cores on macOS and 2 on iOS. An M2 Max with 12 cores still shows 8 in Safari.

**Chrome** reports your actual core count with no limits.

**Brave** randomizes between 2 and your actual count as part of [Shields](https://brave.com/shields/). The value can change between sessions.

## Hardware details

**Apple Silicon** chips (M1 and later) have two core types: performance cores for heavy work and efficiency cores for background tasks. The browser reports the total without distinguishing between them. An M3 Pro with 6 P-cores and 6 E-cores reports 12, but they don't perform equally for compute work.

More on this: [How macOS manages M1 CPU cores](https://eclecticlight.co/2022/04/25/how-macos-manages-m1-cpu-cores/)

**Intel/AMD with hyper-threading** report logical cores, not physical. A 6-core CPU with hyper-threading shows 12. For compute work, hyper-threading adds roughly 20-30% throughput, not double.

## Why we can't be smarter

JavaScript only has access to `navigator.hardwareConcurrency`. There's no browser API to detect:

- Physical vs logical cores
- Performance vs efficiency cores
- CPU architecture

[Mozilla's research](https://blog.mozilla.org/en/firefox/firefox-ai/what-is-the-best-hardware-concurrency-for-running-inference-on-cpu/) found that using all logical cores can degrade performance due to thread scheduling overhead and cache contention. Their recommendation: use physical cores on x86, performance cores only on ARM.

Mozilla's ML team built a utility that detects optimal thread counts using internal browser APIs with direct OS access. These APIs aren't exposed to websites - we only get `navigator.hardwareConcurrency`. Most web apps fall back to heuristics like `Math.ceil(cores / 2)` to guess physical cores, but Mozilla found this underutilizes capable devices while overloading weaker ones. We cap at 4 by default to stay safe across varied hardware.

If you know your hardware and want to push it, use the [settings override](/account/settings).

## Going deeper

- [MDN: Navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)
- [WHATWG: Web Workers Spec](https://html.spec.whatwg.org/multipage/workers.html)
- [Can I use: hardwareConcurrency](https://caniuse.com/hardwareconcurrency)
- [Mozilla Blog: Best hardware concurrency for CPU inference](https://blog.mozilla.org/en/firefox/firefox-ai/what-is-the-best-hardware-concurrency-for-running-inference-on-cpu/)
