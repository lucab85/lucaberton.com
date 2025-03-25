---
draft: false
title: "How to enable WordPress Automatic background updates"
snippet: "Learn how to enable WordPress automatic updates for core, plugins, themes, and translations using a must-use plugin for better security and hands-off maintenance."
publishDate: "2021-05-29"
lastModified: 2025-03-25
category: "wordpress"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=How%20to%20enable%20WordPress%20Automatic%20background%20updates"
  alt: "Cover for How to enable WordPress Automatic background updates"
tags: ["wordpress", "howto"]
---

## Environment

WordPress 3.7+

---

## Issue

How to keep your WordPress site updated using automatic background updates.

---

## Resolution

Use filters to fine-tune automatic update behavior.

Create a **must-use plugin** in the `wp-content/mu-plugins/` directory (create the folder if it doesn't exist), and save the following as `update.php`:

```php
<?php // mu-plugins/update.php
add_filter( 'allow_dev_auto_core_updates', '__return_false' );           // Disable development updates
add_filter( 'allow_major_auto_core_updates', '__return_true' );         // Enable major updates
add_filter( 'allow_minor_auto_core_updates', '__return_true' );         // Enable minor updates
add_filter( 'auto_update_plugin', '__return_true' );                    // Enable plugin updates
add_filter( 'auto_update_theme', '__return_true' );                     // Enable theme updates
add_filter( 'auto_update_translation', '__return_true' );              // Enable translation updates
add_filter( 'auto_core_update_send_email', '__return_true' );          // Enable email notifications
```

> ✅ Must-use plugins are loaded by default and cannot be disabled from the admin panel—ideal for enforcing essential behaviors.

---

## Root Cause

[Automatic background updates](https://wordpress.org/support/article/configuring-automatic-background-updates/) were introduced in [WordPress 3.7](https://codex.wordpress.org/Version_3.7) to improve site security and reduce maintenance effort.

WordPress supports automatic updates for:

- Core updates (minor and major)
- Plugins
- Themes
- Translation files

These updates can be configured via:
- Constants in `wp-config.php` (not recommended for filters)
- Filters in a plugin (recommended)

**Important**: Never add `add_filter()` calls directly in `wp-config.php`. WordPress isn’t fully loaded at that point, and it can cause issues—especially with tools like WP-CLI.

Since WordPress 5.6, automatic updates for both major and minor core versions are enabled by default for new installs.
