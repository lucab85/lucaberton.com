+++
date = "2021-11-08T12:00:00+01:00"
title = "How to configure Google Tag Manager with Google Analytics, Google Ads, Facebook Pixel and Conversions API?"
tags = ["google", "tag"]
categories = ["google", "tag"]
+++

{{< buymeapizza >}}

# Environment

[Google Tag Manager](https://tagmanager.google.com/)

# Issue

How to configure Google Tag Manager with Google Analytics version 4, Google Ads, Facebook Pixel and Conversions API.


# Resolution

## Google Analytics

Google Analytics version 4 requires **two** tags:

- [Google Analytics 4 Configuration tag](https://support.google.com/tagmanager/answer/9442095)

- [Google Analytics 4 Event tag](https://support.google.com/tagmanager/answer/9442095)


Notes:

- Don't apply to Universal Analytics tags (Analytics "UA" prefix) [UA→GA4 Universal Analytics versus Google Analytics 4 data](https://support.google.com/analytics/answer/9964640)

- [GA4 Recommended events](https://support.google.com/analytics/answer/9267735)



## Google Ads


Google Ads requires **three** tags:

- [Google Ads conversions](https://support.google.com/tagmanager/answer/6105160)

- [Standard Google Ads remarketing](https://support.google.com/tagmanager/answer/6106960)

- [Conversion linker](https://support.google.com/tagmanager/answer/7549390)


## Facebook Pixel and Conversions API

Facebook Pixel requires **two** tags:

- [Using Facebook pixel with Google Tag Manager](https://www.facebook.com/business/help/1021909254506499)

- [Conversions API for Server-Side Google Tag Manager](https://developers.facebook.com/docs/marketing-api/conversions-api/guides/gtm-server-side)

{{< buymeapizza >}}