---
draft: false
title: "Nexus 5X and Nexus 6P bootloop fix"
snippet: "Fix the infamous Nexus 5X and 6P bootloop issue (BLOD) by disabling faulty A57 cores and running only on A53 cores using a custom recovery and workaround injector."
publishDate: "2018-07-02"
lastModified: 2025-03-25
category: "howto"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=Nexus%205X%20and%206P%20bootloop%20fix"
  alt: "Cover for Nexus 5X and Nexus 6P bootloop fix"
tags: ["google", "nexus", "blod", "bootloop of death"]
---

## Introduction

Nexus 5X and Nexus 6P smartphones have a hardware issue that causes the infamous "bootloop of death" (aka BLOD). The device continuously shows the Google boot-up animation until the battery dies.

If your device is still under warranty, follow the [official Google Bootloop solution](https://productforums.google.com/d/msg/nexus/jzbjoJHDwzE/NppJBlzrAQAJ).

The issue originates from faulty A57 cores in the SoC—two in the 5X and four in the 6P. This workaround disables the A57 cores so your phone runs only on the A53 cores. It’s a performance compromise, but it keeps your phone usable.

## Disclaimer

*This guide reflects the procedure as of July 2018. The author disclaims liability for any damage or issues caused by following this tutorial.*

---

## Prerequisite: OEM Unlock

- Enable "Developer mode" by tapping 7 times on `Settings > About Phone > Build`
- Enable "OEM Unlock" under "Developer mode"

---

## Requirements

- Phone charged and connected via USB-C to a PC
- [ADB and Fastboot tools installed](https://developer.android.com/studio/releases/platform-tools)
- [USB drivers installed for Windows](https://developer.android.com/studio/run/win-usb)

---

## Downloads

- [Google Factory Image for Nexus 5X](https://developers.google.com/android/images#bullhead) or [Nexus 6P](https://developers.google.com/android/images#angler)
- TWRP Recovery Image (4-core patched):
  - [Nexus 5X](https://basketbuild.com/filedl/devs?dev=osm0sis&dl=osm0sis/osmods/twrp-3.2.1-0-fbe-4core-bullhead.img)
  - [Nexus 6P](https://basketbuild.com/filedl/devs?dev=osm0sis&dl=osm0sis/osmods/twrp-3.2.1-0-fbe-4core-angler.img)
- [Workaround Injector ZIP](https://basketbuild.com/filedl/devs?dev=osm0sis&dl=osm0sis/osmods/N5X-6P_BLOD_Workaround_Injector_Addon-AK2-signed.zip)

---

## Step-by-Step Guide

### Step 0: Verify Device Connection

1. Boot the phone into **Bootloader Mode** (`Power + Volume Down`)
2. On PC, verify connection:

```bash
$ fastboot devices
00d1473289b99283        fastboot
```

---

### Step 1: Restore Factory Image

1. Extract the Factory Image and run `flash-all.sh`
2. Reboot back into **Bootloader Mode**
3. Unlock bootloader (if not already unlocked):

```bash
$ fastboot flashing unlock
```

> Confirm on device using volume and power buttons. The device will be wiped.

---

### Step 2: Flash Patched TWRP

- For Nexus 5X:

```bash
$ fastboot flash recovery twrp-3.2.1-0-fbe-4core-bullhead.img
```

- For Nexus 6P:

```bash
$ fastboot flash recovery twrp-3.2.1-0-fbe-4core-angler.img
```

1. Boot into Recovery Mode
2. In TWRP: go to `Advanced > ADB Sideload` and swipe to start

---

### Step 3: Install Workaround Injector

From your PC:

```bash
$ adb sideload N5X-6P_BLOD_Workaround_Injector_Addon-AK2-signed.zip
```

> This patch disables the faulty A57 cores, keeping only the A53 cores active.

---

## Done!

Reboot your phone and enjoy a BLOD-free experience!

> Optionally, re-lock the bootloader once everything works.

---

## Additional Resources

- [Google official Bootloop solution](https://productforums.google.com/d/msg/nexus/jzbjoJHDwzE/NppJBlzrAQAJ)
- [Bootloader Unlock Guide](https://source.android.com/devices/bootloader/unlock-trusty)
- [Factory Image Instructions](https://developers.google.com/android/images#instructions)
- [Unbold: Image Generator](https://forum.xda-developers.com/nexus-5x/general/tool-unblod-fix-nexus-5x-thats-bootloop-t3718388)
- [Nexus Root Toolkit](http://www.wugfresh.com/nrt/)
- [Reddit BLOD Thread](https://www.reddit.com/r/Nexus6P/comments/5k2pvz/never_ending_bootloop_its_a_hardware_issue_rma/)

