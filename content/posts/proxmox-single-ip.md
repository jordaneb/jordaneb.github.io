---
title: "Effective use of 1 IP on Proxmox"
date: "2025-04-01"
description: "How I network multiple Proxmox VMs with a single public IPv4."
tags: ["proxmox", "networking", "homelab"]
audioUrl: "https://jordaneb.lon1.cdn.digitaloceanspaces.com/jordaneb/pages/proxmox-single-ip/tts.mp3"
---

## Introduction

I picked up a couple of low‑end bare metal boxes from OVH’s Kimsufi range. For the price, they’re great, but you only get one public IPv4 address, with no option to buy more. That makes running multiple internet‑facing services a little awkward.

I run almost everything on Proxmox because snapshots, backups, and quick experimentation are easy. This is a brain‑dump of what’s been working for me to network multiple VMs with a single public IP.

---

## Giving VMs Internet Access with NAT

### Host Configuration

Make the Proxmox host behave like a home router: give VMs a private subnet and NAT outbound traffic through the host’s public IP.

Add to the bottom of `/etc/network/interfaces`:

```bash
auto vmbr1
iface vmbr1 inet static
    address  10.6.0.1
    netmask  255.255.255.0
    bridge_ports none
    bridge_stp off
    bridge_fd 0

    post-up echo 1 > /proc/sys/net/ipv4/ip_forward
    post-up   iptables -t nat -A POSTROUTING -s '10.6.0.0/24' -o vmbr0 -j MASQUERADE
    post-down iptables -t nat -D POSTROUTING -s '10.6.0.0/24' -o vmbr0 -j MASQUERADE
```

This:

- Creates a new virtual bridge `vmbr1`.
- Enables IP forwarding on the host.
- NATs all outbound traffic from `10.6.0.0/24` to look like it came from the host’s public IP.

Notes:

- Use a unique bridge name (`vmbr2` etc if needed).
- Any private subnet works as long as you update the iptables rules.
- `vmbr0` is assumed to be the public interface.

### VM/CT Configuration

When setting up a VM or container:

- Attach the NIC to `vmbr1` in the Proxmox UI.
- Uncheck the “Firewall” option on that NIC.

Inside the VM:

- Set a static IP (e.g. `10.6.0.20`).
- Set the gateway to `10.6.0.1`.

---

## Forwarding Ports to VMs

To expose a service inside a VM, forward specific ports:

```bash
auto vmbr1
iface vmbr1 inet static

# rest of interface config...

# UDP port
post-up iptables -t nat -A PREROUTING -i vmbr0 -p udp --dport 51820 -j DNAT --to 10.6.0.100:51820
post-down iptables -t nat -D PREROUTING -i vmbr0 -p udp --dport 51820 -j DNAT --to 10.6.0.100:51820

# TCP port
post-up iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 25565 -j DNAT --to 10.6.0.65:25565
post-down iptables -t nat -D PREROUTING -i vmbr0 -p tcp --dport 25565 -j DNAT --to 10.6.0.65:25565
```

Notes:

- Don’t forward the same port to multiple machines.
- `iptables -t nat -L -v` shows active rules.

---

## Hosting Multiple Web Servers

I like each web server to manage its own TLS certs and termination locally. To route multiple TLS backends behind one IP, I run an NGINX proxy VM at the edge that uses SNI to forward raw TLS streams.

With the stream module enabled:

```nginx
stream {
    map $ssl_preread_server_name $tlsBackend {
        www.example.com 10.6.0.80:443;
    }

    server {
        listen 443;
        proxy_pass $tlsBackend;
        ssl_preread on;
    }
}
```

For HTTP‑01 challenges, forward port 80 and proxy normal HTTP:

```nginx
server {
    listen 80;
    server_name www.example.com;

    location / {
        proxy_pass http://10.6.0.80:80;
        proxy_set_header Host www.example.com;
        proxy_pass_request_headers on;
    }
}
```

---

## A Quick Note on SRV Records

SRV records are handy for mapping subdomains to different service ports. With Minecraft, for example:

- `server1.example.com` → port 25565  
- `server2.example.com` → port 25566

This Namecheap guide explains it well: https://www.namecheap.com/support/knowledgebase/article.aspx/9765/2208/how-can-i-link-my-domain-name-to-a-minecraft-server/

