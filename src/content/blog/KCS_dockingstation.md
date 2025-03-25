---
draft: false
title: "Why monitor flicks on my ThinkPad Thunderbolt 3 Dock (40AC) Gen1?"
snippet: "Experiencing screen flickering when using a ThinkPad Thunderbolt 3 Dock with macOS? Learn why it happens and how to work around the issue using supported alternatives."
publishDate: "2021-09-06"
lastModified: 2025-03-25
category: "hardware"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=Why%20monitor%20flicks%20on%20ThinkPad%20Thunderbolt%203%20Dock"
  alt: "Cover placeholder for Why monitor flicks on ThinkPad Thunderbolt 3 Dock"
tags: ["macos", "dockingstation"]
---

## Environment

macOS Big Sur version 11.5

---

## Issue

External monitor flickers or "blinks" every couple of seconds when connected to a MacBook Pro via a ThinkPad Thunderbolt 3 Dock Gen1 (Model No: 40AC - DBB9003L1) using DisplayPort.

The monitor is configured as an extended display.

---

## Diagnostic Steps

- Issue **does not** occur when using the same dock and monitor with a **Windows 10 laptop**
- Blinking **persists** when switching to an HDMI cable through the same dock
- Replacing the dock and cables **does not resolve** the issue
- **SMC reset** on the Mac does not help ([reset instructions](http://osxdaily.com/2014/01/04/fix-flickering-screen-external-display-mac/))
- Lowering resolution and refresh rate (e.g., 1080p or 720p) **does not fix** the issue

---

## Resolution

- Use a **USB-C to HDMI adapter** instead of the dock to connect the monitor—this works without flickering
- Replace the docking station with a macOS-compatible alternative, such as:
  - [CalDigit USB-C Pro Dock](https://www.caldigit.com/usb-c-pro-dock/)
  - [OWC Thunderbolt 3 Dock (14-port)](https://www.owcdigital.com/products/thunderbolt-3-dock-14-port/)
- Try **DisplayLink Manager** for macOS:
  - [Download DisplayLink Manager](https://www.synaptics.com/products/displaylink-graphics/downloads/macos)
  - [DisplayLink Installation Guide](https://support.displaylink.com/knowledgebase/articles/1932214)

---

## Root Cause

The ThinkPad dock uses **DisplayPort Multi Stream Transport (MST) Hub** for its DisplayPort outputs. While this enables multiple extended displays on Windows, macOS **does not support DisplayPort MST**.

macOS only supports one display per Thunderbolt 3 port and **does not** support chaining via MST. Apple likely views MST as a legacy technology and instead favors Thunderbolt daisy-chaining.

You can learn more here:

- [Tripplite: MST Hub Technology](https://www.tripplite.com/products/multi-stream-transport-mst-hub-technology)
- [CalDigit: MST Compatibility](https://www.caldigit.com/can-ts3-and-ts3-plus-support-displayport-multi-stream-transport-mst-feature/)
- [Detailed overview of MacBook Pro and MST limitations](https://sebvance.medium.com/everything-you-need-to-know-about-macbook-pros-and-their-lack-of-displayport-mst-multi-stream-98ce33d64af4)
