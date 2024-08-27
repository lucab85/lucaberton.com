+++
date = "2021-05-29T12:00:00+02:00"
title = "How to enable WordPress Automatic background updates"
tags = ["wordpress", "howto"]
categories = ["wordpress", "howto"]
+++

{{< buymeapizza >}}

# Environment

WordPress 3.7+

# Issue

Maintain up to date a Website with WordPress Automatic background updates.

# Resolution

Using filters allows for fine-tuned control of WordPress Automatic Updates.

Add the following filters in a [must-use plugin](https://wordpress.org/support/article/must-use-plugins/) - under `wp-content/mu-plugins` by default:

- `wp-content/mu-plugins/update.php`
```php
<?php // mu-plugins/update.php
add_filter( 'allow_dev_auto_core_updates', '__return_false' );           // Enable nightlies (dev updates) 
add_filter( 'allow_major_auto_core_updates', '__return_true' );         // Enable major updates
add_filter( 'allow_minor_auto_core_updates', '__return_true' );         // Enable minor updates
add_filter( 'auto_update_plugin', '__return_true' );
add_filter( 'auto_update_theme', '__return_true' );
add_filter( 'auto_update_translation', '__return_true' );
add_filter( 'auto_core_update_send_email', '__return_true' );
```


# Root Cause

[WordPress Automatic background updates](https://wordpress.org/support/article/configuring-automatic-background-updates/) are available since [WordPress 3.7](https://codex.wordpress.org/Version_3.7) to promote better security.
There are four types of automatic background updates:

- Core updates
- Plugin updates
- Theme updates
- Translation file updates

Automatic updates can be configured using one of two methods: defining constants in `wp-config.php`, or adding filters using a Plugin.

Before WordPress 5.6 by default, every site had automatic updates enabled only for minor core releases and translation files only. In WordPress 5.6+, every new site has automatic enabled for both minor and major releases.

The best place to put these filters is in a [must-use plugin](https://wordpress.org/support/article/must-use-plugins/).

Do not add `add_filter()` calls directly in `wp-config.php` because WordPress isn’t fully loaded and can cause conflicts with other applications such as WP-CLI.

{{< buymeapizza >}}