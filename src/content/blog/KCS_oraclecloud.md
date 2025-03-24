---
draft: false
title: "How to configure Postfix to Send Email in Oracle Cloud?"
snippet: "Learn how to configure Postfix to send emails using Oracle Cloud Infrastructure’s Email Delivery service with step-by-step setup for SMTP authentication."
publishDate: "2021-11-09"
category: "kcs"
author: "Luca Berton"
image:
  src: "https://placehold.co/600x400?text=How to configure Postfix to Send Email in Oracle Cloud?"
  alt: "Cover for How to configure Postfix to Send Email in Oracle Cloud?"
tags: ["oracle", "postfix"]
---

## Environment

[Oracle Cloud Infrastructure](https://www.oracle.com/cloud/)

## Issue

How to configure Postfix to Send Email in Oracle Cloud Infrastructure via the through the [Email Delivery](https://docs.oracle.com/en-us/iaas/Content/Email/Concepts/overview.htm) service.

## Resolution

1) [Integrating Postfix with Email Delivery](https://docs.oracle.com/en-us/iaas/Content/Email/Reference/postfix.htm)

For `SMTP server` follow the guide: 

[SMTP Authentication and Connection Endpoints](https://docs.oracle.com/en-us/iaas/Content/Email/Concepts/overview.htm#Regions)

For example:
Germany Central (Frankfurt): `smtp.email.eu-frankfurt-1.oci.oraclecloud.com`


- /etc/postfix/main.cf
```bash
relayhost = smtp.email.eu-frankfurt-1.oci.oraclecloud.com:587
```

- /etc/postfix/sasl_passwd
```bash
smtp.email.eu-frankfurt-1.oci.oraclecloud.com:587 user:pass
```

For `user:pass` follow the guide: 

2) [Generate SMTP Credentials for a user](https://docs.oracle.com/en-us/iaas/Content/Email/Reference/gettingstarted.htm#Getting_Started_with_Email_Delivery)

