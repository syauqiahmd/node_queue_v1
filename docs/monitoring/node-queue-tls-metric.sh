#!/bin/sh
# Writes the expiry time of the certificate nginx serves for each domain, for Grafana alerting
# (read by Alloy textfile collector). Run hourly from cron.
OUT=/var/lib/node_queue_metrics/tls.prom
TMP="$OUT.$$"
{
  echo "# HELP node_queue_tls_cert_expiry_timestamp_seconds Expiry time of the certificate served for the domain."
  echo "# TYPE node_queue_tls_cert_expiry_timestamp_seconds gauge"
  for d in qms-mpp.web.id www.qms-mpp.web.id api.qms-mpp.web.id ws.qms-mpp.web.id; do
    end=$(echo | openssl s_client -connect 127.0.0.1:443 -servername "$d" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    [ -n "$end" ] && echo "node_queue_tls_cert_expiry_timestamp_seconds{domain=\"$d\"} $(date -d "$end" +%s)"
  done
} > "$TMP" && chmod 640 "$TMP" && mv "$TMP" "$OUT"
