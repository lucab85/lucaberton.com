---
draft: false
title: "Packaging a Hugging Face Model Snapshot"
snippet: "Learn how to download a Hugging Face model as real files and package it into a portable tarball for offline use, archival, or distribution."
publishDate: "2026-02-02"
category: "ai"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=Packaging+HuggingFace+Model+Snapshot"
  alt: "Cover for Packaging a Hugging Face Model Snapshot into a Portable tar.gz"
tags: ["huggingface", "ai", "python", "howto", "mlops"]
---

If you've ever needed to move a Hugging Face model to an offline machine, ship it to a colleague, or archive an exact version for reproducibility, you've probably discovered an annoying detail: a "downloaded model" isn't always a neat folder of files. Depending on how you pull it down, you can end up with symlinks, cache indirection, or a layout that isn't friendly to copying.

A simple, reliable pattern is:

1. Download a full repository snapshot as **real files** (no symlinks).
2. Compress that directory into a **single tarball** you can store or transport anywhere.

Here's a clean example using the Hugging Face Hub Python client and `tar`.

---

## Step 1: Download a full snapshot with real files

The Hugging Face Hub client provides `snapshot_download`, which can fetch a repository at a specific revision and materialize it locally.

```bash
python - <<'PY'
from huggingface_hub import snapshot_download

repo_id = "mistralai/Ministral-3-3B-Instruct-2512"  # change me
local_dir = "./hf_repo"

snapshot_download(
    repo_id=repo_id,
    local_dir=local_dir,
    local_dir_use_symlinks=False,   # IMPORTANT: makes real files (good for tar)
)
print("Downloaded to", local_dir)
PY
```

### Why `local_dir_use_symlinks=False` matters

By default, Hugging Face may use symlinks that point into its local cache. That's efficient on your machine, but it's a trap if you plan to:

* zip/tar the directory,
* copy it to a USB drive,
* upload it to object storage,
* move it to a different computer.

Symlinks can break when the target cache isn't present on the destination system. Setting `local_dir_use_symlinks=False` forces the download into actual files, so the directory becomes self-contained and portable.

---

## Step 2: Create a compressed tarball

Once your snapshot is in `./hf_repo`, package it up:

```bash
tar -czf Ministral-3-3B-Instruct-2512.tar.gz -C hf_repo .
```

### What this command is doing (in plain English)

* `tar` creates an archive
* `-c` = create
* `-z` = gzip compression
* `-f` = output filename follows (`Ministral-3-3B-Instruct-2512.tar.gz`)
* `-C hf_repo` = *change into the `hf_repo` directory first*
* `.` = archive "everything in this folder"

That `-C hf_repo .` pattern is a subtle best practice: it keeps your archive clean so it extracts into the current directory (or into whatever folder you choose), rather than embedding the whole `hf_repo/` path prefix.

---

## Verifying the tarball

Before you ship it off, it's worth quickly checking that the archive contains what you expect:

```bash
tar -tzf Ministral-3-3B-Instruct-2512.tar.gz | head
```

To test extraction into a new folder:

```bash
mkdir -p /tmp/model_test
tar -xzf Ministral-3-3B-Instruct-2512.tar.gz -C /tmp/model_test
ls -la /tmp/model_test | head
```

---

## Using the snapshot offline

Once extracted, most Hugging Face workflows can load from a local directory path rather than a remote repo ID. For example, you can point your tooling at the extracted folder and avoid network access entirely (often with an offline flag or environment variable depending on your stack).

The important part is that you now have a deterministic, portable bundle: **the exact repository snapshot you downloaded**, frozen in a single file.

---

## Common gotchas (and how to avoid them)

### 1) "My archive is huge"

Model repos can be large, and tarballs compress differently depending on file types. Expect modest gains for already-compressed weights (some formats won't shrink much).

### 2) "It downloads different files later"

If you care about reproducibility, pin a revision. `snapshot_download` supports specifying a particular commit hash or tag so you don't accidentally capture a moving target.

### 3) "My tar extracts into a weird nested path"

Use `tar -C hf_repo .` like shown above to keep the archive root tidy.

---

## The takeaway

With two commands, you get a robust workflow:

* `snapshot_download(..., local_dir_use_symlinks=False)` to build a self-contained snapshot directory.
* `tar -czf ... -C hf_repo .` to package it into a single portable artifact.

This is a practical way to archive models, move them across environments, and ensure you can recreate an exact setup later—without depending on a cache layout or a live network connection.
