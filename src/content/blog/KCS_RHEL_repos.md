---
draft: false
title: "How to solve 403 repository error with RHEL 8?"
snippet: "Fixing the 403 error when updating RHEL 8 repositories on EC2 instances using Red Hat subscription tools."
publishDate: "2021-05-29"
lastModified: 2025-03-25
category: "kcs"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=How to solve 403 repository error with RHEL 8"
  alt: "Cover for How to solve 403 repository error with RHEL 8"
tags: ["rhel", "howto"]
---

## Environment

RedHat Enterprise Linux 8 in AWS EC2 (AMI name: `RHEL-8.3.0_HVM-20201031-x86_64-0-Hourly2-GP2`)

## Issue

```bash
Updating Subscription Management repositories.
Red Hat Update Infrastructure 3 Client Configuration Server 8                                         5.8 kB/s | 2.1 kB     00:00    
Red Hat Update Infrastructure 3 Client Configuration Server 8                                          23 kB/s | 3.9 kB     00:00    
Red Hat Enterprise Linux 8 for x86_64 - AppStream from RHUI (RPMs)                                     26 kB/s | 2.8 kB     00:00    
Red Hat Enterprise Linux 8 for x86_64 - AppStream from RHUI (RPMs)                                     48 MB/s |  32 MB     00:00    
Red Hat Enterprise Linux 8 for x86_64 - BaseOS from RHUI (RPMs)                                        23 kB/s | 2.4 kB     00:00    
Red Hat Enterprise Linux 8 for x86_64 - BaseOS from RHUI (RPMs)                                        54 MB/s |  35 MB     00:00    
Red Hat Enterprise Linux 8 for x86_64 - BaseOS (RPMs)                                                 617  B/s | 358  B     00:00    
Errors during downloading metadata for repository 'rhel-8-for-x86_64-baseos-rpms':
  - Status code: 403 for https://cdn.redhat.com/content/dist/rhel8/8/x86_64/baseos/os/repodata/repomd.xml (IP: 104.68.188.83)
Error: Failed to download metadata for repo 'rhel-8-for-x86_64-baseos-rpms': Cannot download repomd.xml: Cannot download repodata/repomd.xml: All mirrors were tried
```

## Resolution

```bash
# dnf clean all
Updating Subscription Management repositories.
55 files removed
# rm -frv /var/cache/dnf
removed directory '/var/cache/dnf'
# subscription-manager refresh
1 local certificate has been deleted.
All local data refreshed
# dnf update
```

## Root Cause

AMI name - `RHEL-8.3.0_HVM-20201031-x86_64-0-Hourly2-GP2`
