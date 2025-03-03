+++
date = "2021-09-06T12:00:00+02:00"
title = "Why monitor flicks on my ThinkPad Thunderbolt 3 Dock (40AC) Gen1?"
tags = ["macos", "dockingstation"]
categories = ["macos", "hardware"]
+++

{{< buymeapizza >}}

# Environment

macOS Big Sur version 11.5 

# Issue

The monitor "blinks" every couple of seconds.

The MacBook Pro is connected to the ThinkPad Thunderbolt 3 Dock Gen1 (Model No: 40AC - DBB9003L1). The monitor is connected to the dock using the Displayport cable. The monitor(s) are configured as "extended".

# Diagnostic Steps

- Usage with a Windows 10 laptop with the same dock and monitor does not recreate the issue.

- Usage the same HDMI cable as above but connected via the dock, the blinking persists.

- Replacing the cables and the dock itself with the same result.

- Performed a System Management Controller Reset on the Mac according to [this article](http://osxdaily.com/2014/01/04/fix-flickering-screen-external-display-mac/) did not improve the situation.

- I tried lowering the resolution (1080p/720p) and refresh rates for the monitor as a test, the behavior did not change.

# Resolution

- Use a USB-C -> HDMI adapter with the MacBook Pro and the same monitor, it works fine.

- Replace the docking station for example:

CalDigit USB-C Pro Dock model [USBCProDock-AU07-SG](https://www.caldigit.com/usb-c-pro-dock/)

[OWC Thunderbolt 3 Dock](https://www.owcdigital.com/products/thunderbolt-3-dock-14-port/)


- Try DisplayLink Manager software
DisplayLink Manager is a new way to enable your DisplayLink dock, adapter or monitor on macOS platforms. It's an application that combines our latest driver with features that streamline the setup of mutliple displays up to 4K.

[DisplayLink Manager Graphics Connectivity download](https://www.synaptics.com/products/displaylink-graphics/downloads/macos)

[DisplayLink Manager App for macOS Introduction, Installation & Scope](https://support.displaylink.com/knowledgebase/articles/1932214)

# Root Cause

The ThinkPad Docks use the **DisplayPort Multi Stream Transport (MST) Hub** standard on the two exposed DisplayPort ports. This technique allows multiple external monitors to act as extended screen area as long as the hardware and driver support MST Hub. Without MST Hub support, multiple external monitors on the dock can only act as mirrors of each other. Unfortunately, macOS does not support DisplayPort MST Hub. Only Thunderbolt chained monitors are supported. Presumably, Apple regards MST Hub as a legacy, dead-end technology.
You can read more about DisplayPort MST technology at https://www.tripplite.com/products/multi-stream-transport-mst-hub-technology and https://www.caldigit.com/can-ts3-and-ts3-plus-support-displayport-multi-stream-transport-mst-feature/

Currently (April 2021), each Mac Thunderbolt 3 port supports only one display per Thunderbolt 3 port, and it needs to be the last one in the Thunderbolt 3 chain. I don't know for sure, but I suspect this refers to monitors using the DisplayPort Alternate Mode on the Thunderbolt 3 chain.

[Everything you need to know about MacBook Pros and (their lack of) DisplayPort MST (Multi-Stream) support](
https://sebvance.medium.com/everything-you-need-to-know-about-macbook-pros-and-their-lack-of-displayport-mst-multi-stream-98ce33d64af4)

{{< buymeapizza >}}