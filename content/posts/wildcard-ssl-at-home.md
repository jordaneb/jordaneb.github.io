---
title: "Secure Wildcard Let's Encrypt TLS Certificates Using DNS Subdelegation"
date: "2025-02-01"
description: "Automating wildcard cert renewals without giving away full DNS control."
tags: ["tls", "letsencrypt", "dns", "homelab"]
audioUrl: "https://jordaneb.lon1.cdn.digitaloceanspaces.com/jordaneb/pages/wildcard-ssl-at-home/tts.mp3"
---

## Introduction

I’ve been using wildcard TLS certs for home servers for a while. My setup: a VM whose only job is to obtain and serve certificates to other machines on my network. It runs NGINX with basic auth, and servers pull the private key and cert over HTTPS.

The weak spot was renewals. Let’s Encrypt certs last 90 days, and I’d been doing renewals manually. I didn’t want to store full DNS provider credentials on an internet‑exposed box because my provider doesn’t support scoped API tokens.

DNS subdelegation turned out to be the workaround I needed.

## What Is DNS Delegation?

Delegation lets you assign responsibility for a subdomain to different nameservers. Example:

```txt
user1.yourdomain.com NS dns01.externaldnsprovider.com
```

The external provider can manage everything under `user1.yourdomain.com` without access to the parent domain.

## Why Subdelegate?

Many DNS providers don’t allow tokens scoped to a single subdomain. With subdelegation, I can hand control of `_acme-challenge.yourdomain.com` to a separate provider that is API‑friendly and isolated. Even if that token leaks, the worst case is rogue cert issuance (revocable) rather than full DNS compromise.

## Automating Wildcard TLS with DNS‑01 Challenge

I use Hetzner DNS because it’s free, supports ACME over API, and I don’t use it for anything else.

The auth hook script:

```bash
#!/bin/bash

token=$(cat /etc/hetzner-dns-token)
search_name=$( echo $CERTBOT_DOMAIN | rev | cut -d'.' -f 1,2 | rev)

zone_id=$(curl \
    -H "Auth-API-Token: ${token}" \
    "https://dns.hetzner.com/api/v1/zones?search_name=${search_name}" | \
    jq ".\"zones\"[] | select(.name == \"${search_name}\") | .id" 2>/dev/null | tr -d '"')

curl -X "POST" "https://dns.hetzner.com/api/v1/records" \
    -H 'Content-Type: application/json' \
    -H "Auth-API-Token: ${token}" \
    -d "{ \"value\": \"${CERTBOT_VALIDATION}\", \"ttl\": 300, \"type\": \"TXT\", \"name\": \"_acme-challenge.${CERTBOT_DOMAIN}.\", \"zone_id\": \"${zone_id}\" }" > /dev/null 2>/dev/null

sleep 30
```

The certbot command:

```bash
sudo certbot certonly \
  --manual \
  --manual-auth-hook /path/to/certbot-hetzner-auth.sh \
  --preferred-challenges=dns \
  --email you@yourdomain.com \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  --manual-public-ip-logging-ok \
  -d *.yourdomain.com
```

Certs end up in:

```txt
/etc/letsencrypt/live/yourdomain.com/
```

From there my internal distribution VM serves them to the rest of the LAN.

## Wrapping Up

This isn’t the cleanest setup in the world, but it keeps the automation simple and the blast radius small. Subdelegating `_acme-challenge` means I can renew wildcard certs without handing over control of my whole DNS zone.

