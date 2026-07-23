---
draft: true
title: "Fix Ansible and Python fork on macOS High Sierra+"
snippet: "Explains why Python and Ansible crash on macOS High Sierra+ due to fork safety, and the one-line fix using OBJC_DISABLE_INITIALIZE_FORK_SAFETY."
publishDate: "2021-08-19"
lastModified: "2026-07-01"
category: "kcs"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=Why Ansible and Python fork break on macOS High Sierra+ and how to solve"
  alt: "Cover for Why Ansible and Python fork break on macOS High Sierra+ and how to solve"
tags: ["macOS", "howto"]
---

## Environment

macOS High Sierra+

## Issue

```bash
objc[22868]: +[__NSCFConstantString initialize] may have been in progress in another thread when fork() was called.
objc[22868]: +[__NSCFConstantString initialize] may have been in progress in another thread when fork() was called. We cannot safely call it or ignore it in the fork() child process. Crashing instead. Set a breakpoint on objc_initializeAfterForkError to debug.
```


## Resolution

- current session only

```bash
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
```

- for all future sessions

```bash
$ echo "OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES" >> .bash_profile
```
Save, exit, close terminal and re-open the terminal.
Verify with:

```bash
$ env
[...]
OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
```

## Root Cause

This error is caused by an added security to restrict multithreading in macOS High Sierra and later versions.

Apple has [defined some rules on what is allowed and not allowed after forking](https://sealiesoftware.com/blog/archive/2017/6/5/Objective-C_and_fork_in_macOS_1013.html) and they have also added async-signal-safety to a limited number of APIs.
