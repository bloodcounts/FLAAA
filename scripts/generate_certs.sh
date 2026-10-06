#!/usr/bin/env bash
# Generate development TLS credentials and a separate P-256 audit signing key.
set -euo pipefail
umask 077
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CERT_DIR="${CERT_DIR:-$ROOT_DIR/certificates}"
PDP_CERT_DIR="${PDP_CERT_DIR:-$ROOT_DIR/pdp/certs}"
DAYS="${DAYS:-825}"
mkdir -p "$CERT_DIR" "$PDP_CERT_DIR"

if [ ! -f "$CERT_DIR/ca.key" ]; then
  if [ -f "$CERT_DIR/ca.crt" ]; then
    echo "CA certificate exists without its key; provide a complete CA pair." >&2
    exit 1
  fi
  openssl ecparam -genkey -name prime256v1 -noout -out "$CERT_DIR/ca.key"
fi
if [ ! -f "$CERT_DIR/ca.crt" ]; then
  openssl req -new -x509 -days "$DAYS" -key "$CERT_DIR/ca.key" \
    -out "$CERT_DIR/ca.crt" -subj "/CN=FLAAA-CA/O=FL-Health-Platform"
fi

issue_certificate() {
  local target_dir="$1" prefix="$2" common_name="$3" alt_names="$4"
  if [ -f "$target_dir/$prefix.crt" ] && [ -f "$target_dir/$prefix.key" ]; then
    openssl verify -CAfile "$CERT_DIR/ca.crt" "$target_dir/$prefix.crt"
    return
  fi
  if [ -f "$target_dir/$prefix.crt" ] || [ -f "$target_dir/$prefix.key" ]; then
    echo "Incomplete TLS key/certificate pair: $target_dir/$prefix" >&2
    exit 1
  fi
  openssl ecparam -genkey -name prime256v1 -noout -out "$target_dir/$prefix.key"
  openssl req -new -key "$target_dir/$prefix.key" -out "$target_dir/$prefix.csr" \
    -subj "/CN=$common_name/O=FL-Health-Platform"
  printf 'subjectAltName=%s\n' "$alt_names" > "$target_dir/$prefix.ext"
  openssl x509 -req -days "$DAYS" -in "$target_dir/$prefix.csr" \
    -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
    -extfile "$target_dir/$prefix.ext" -out "$target_dir/$prefix.crt"
  rm -f "$target_dir/$prefix.csr" "$target_dir/$prefix.ext"
}
issue_certificate "$CERT_DIR" server superlink 'DNS:localhost,DNS:superlink,IP:127.0.0.1'
issue_certificate "$PDP_CERT_DIR" pdp_tls pdp 'DNS:localhost,DNS:pdp,IP:127.0.0.1'
cp "$CERT_DIR/server.crt" "$CERT_DIR/server.pem"
cp "$CERT_DIR/ca.crt" "$PDP_CERT_DIR/ca.crt"

# Preserve the signing key across restarts; key rotation requires archived public keys.
if [ ! -f "$PDP_CERT_DIR/pdp_sign_key.pem" ]; then
  if [ -f "$PDP_CERT_DIR/pdp_sign_pub.pem" ]; then
    echo 'Audit public key exists without its private key; choose a new key directory and key id.' >&2
    exit 1
  fi
  openssl ecparam -genkey -name prime256v1 -noout -out "$PDP_CERT_DIR/pdp_sign_key.pem"
fi
openssl ec -in "$PDP_CERT_DIR/pdp_sign_key.pem" -pubout -out "$PDP_CERT_DIR/pdp_sign_pub.pem"
openssl verify -CAfile "$CERT_DIR/ca.crt" "$CERT_DIR/server.crt" "$PDP_CERT_DIR/pdp_tls.crt"
echo 'Development TLS credentials and audit key are ready.'
