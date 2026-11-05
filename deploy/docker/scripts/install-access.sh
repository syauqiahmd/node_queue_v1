#!/bin/bash
# Run as root from the deploy folder:   sudo VPN_NET=<cidr> bash scripts/install-access.sh
#   1. SSH: lets the deploy user (only) open a local tunnel to Postgres 127.0.0.1:5432, for
#      DBeaver. Server-wide "AllowTcpForwarding no" stays in force for everyone else; the
#      script reverts itself if the effective config of any other user would change.
#   2. Fail2ban (optional, when VPN_NET is set): never ban that network, e.g. the admin VPN
#      pool when the VPN hands out changing IPs.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "run with sudo"; exit 1; }
SITE="$(cd "$(dirname "$0")/.." && pwd)"
APP_USER="$(stat -c %U "$SITE")"
CONF=/etc/ssh/sshd_config.d/90-qms-db-tunnel.conf
before=$(mktemp); after=$(mktemp); trap 'rm -f "$before" "$after"' EXIT
sshd -T -C user=root,host=x,addr=192.0.2.1 | sort > "$before"
cat > "$CONF" <<SSHD
# [QMS] DBeaver tunnel to the Postgres container (127.0.0.1:5432), $APP_USER only.
Match User $APP_USER
    AllowTcpForwarding local
    PermitOpen 127.0.0.1:5432
SSHD
chmod 644 "$CONF"
if ! sshd -t; then rm -f "$CONF"; echo "sshd config invalid, reverted"; exit 1; fi
sshd -T -C user=root,host=x,addr=192.0.2.1 | sort > "$after"
if ! diff -q "$before" "$after" >/dev/null; then
  rm -f "$CONF"; echo "unexpected change for other users, reverted:"; diff "$before" "$after" || true; exit 1
fi
echo "$APP_USER effective: $(sshd -T -C user=$APP_USER,host=x,addr=192.0.2.1 | grep -E '^(allowtcpforwarding|permitopen) ' | tr '\n' ' ')"
systemctl reload ssh 2>/dev/null || systemctl reload sshd
echo "ssh reloaded (existing sessions stay open)"

if [ -n "${VPN_NET:-}" ]; then
  J=/etc/fail2ban/jail.local
  [ -f $J.bak-pre-vpnpool ] || cp -a $J $J.bak-pre-vpnpool
  grep -q "^ignoreip = .* ${VPN_NET//./\\.}\b" $J || sed -i -E "s#^(ignoreip = .*)\$#\1 $VPN_NET#" $J
  grep -n '^ignoreip' $J
  fail2ban-client -t >/dev/null && fail2ban-client reload >/dev/null && echo "fail2ban reloaded"
fi
