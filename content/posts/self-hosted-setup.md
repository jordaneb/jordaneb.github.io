---
title: "My Self-Hosted Setup"
date: "2025-03-01"
description: "A simple, compartmentalised Proxmox homelab with portable backups."
tags: ["homelab", "self-hosting", "proxmox"]
audioUrl: "https://jordaneb.lon1.cdn.digitaloceanspaces.com/jordaneb/pages/self-hosted-setup/tts.mp3"
---

### What I’m Trying to Do

There are two main things I’m optimizing for:

- **Compartmentalisation**: I keep services isolated from one another. It means I can back up or restore just one service without affecting others. The trade‑off is multiple OS installs, but tinkering and rollback are easier.
- **Reliable and portable backups**: I want dead‑simple backups that can be cloned and restored anywhere. I avoid incremental backups and prefer full snapshots that are easy to move around.

### Hardware

Everything runs on a fleet of Lenovo M93P SFF boxes. Each has 12GB RAM and a standard SSD. They’re quiet, power‑efficient, and good enough for what I need.

### Making Backups Easy

Proxmox makes decoupling services from physical hardware easy. I can take full VM snapshots and restore them to any node with enough disk space.

I only use KVM (no LXC) to avoid host‑dependency surprises, and I use LVM thin pools to over‑allocate disk and keep storage flexible. “Discard” is enabled to reduce snapshot size.

### Backup Strategy: "3‑2‑1" (Sort of)

Locally I back up to a separate NFS server with two drives: a small SSD and a 2.5" spinning disk. The SSD is primary and the HDD is a nightly `rsync` mirror, giving me two local copies on separate media.

Off‑site backups happen weekly. Upload speed makes daily syncs unrealistic, so a Tuesday cron job pushes Monday’s backup to a Hetzner Storage Box. I chose it for:

- SSH support (`rsync` via keys).
- Snapshots through the web UI that are hard to tamper with.

Everything is encrypted with GPG symmetric encryption before uploading.

### DNS and DHCP

AdGuard Home runs on a Raspberry Pi 3 with DietPi, but ad‑blocking is disabled. DNS‑level ad blocking breaks too many mobile apps, and uBlock Origin on desktops is enough.

### Power Outage Recovery

After a couple months of random power cuts, I realised the homelab wouldn’t reliably come back online unattended. Fixes:

1. Enable BIOS auto‑power‑on after power loss.
2. A Raspberry Pi script sends periodic Wake‑on‑LAN packets with `etherwake` every 5 minutes to machines that should be always on.

Probably overkill, but it’s been solid.

### Remote Access

Remote access is via OpenVPN on my router. I tried WireGuard on another box but it wasn’t as reliable in edge cases.

### Wrapping Up

This setup isn’t elegant in the traditional sense, but it does what I want: each service in its own VM, backups are simple, restores are quick, and experimentation is low‑stress.

