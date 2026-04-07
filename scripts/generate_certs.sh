#!/usr/bin/env bash
# generate_certs.sh — Generate all platform certificates
#
# Produces:
#   $CERT_DIR/ca.key          CA private key
#   $CERT_DIR/ca.crt          CA certificate (self-signed)
#   $CERT_DIR/server.key      SuperLink server private key
#   $CERT_DIR/server.crt      SuperLink server certificate (CA-signed)
#   $CERT_DIR/server.pem      Alias for server.crt (expected by run.bash)
#   $PDP_CERT_DIR/pdp_sign_key.pem   PDP JWS signing key (EC P-256)
#   $PDP_CERT_DIR/pdp_sign_pub.pem   PDP JWS public key (for verify_logs.js)
#
# Usage:
#   bash scripts/generate_certs.sh
#
# Override defaults via env:
#   CERT_DIR=./certificates DAYS=825 bash scripts/generate_certs.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CERT_DIR="${CERT_DIR:-$ROOT_DIR/certificates}"
PDP_CERT_DIR="${PDP_CERT_DIR:-$ROOT_DIR/pdp/certs}"
DAYS="${DAYS:-825}"

echo "==> Generating platform certificates"
echo "    SuperLink certs : $CERT_DIR"
echo "    PDP signing key : $PDP_CERT_DIR"
echo "    Validity        : $DAYS days"
echo ""

mkdir -p "$CERT_DIR" "$PDP_CERT_DIR"

# ── SuperLink SSL/TLS ──────────────────────────────────────────────────────────

echo "--> CA private key"
openssl ecparam -genkey -name prime256v1 -noout -out "$CERT_DIR/ca.key"

echo "--> CA certificate (self-signed)"
openssl req -new -x509 -days "$DAYS" \
  -key "$CERT_DIR/ca.key" \
  -out "$CERT_DIR/ca.crt" \
  -subj "/CN=FLAAA-CA/O=FL-Health-Platform"

echo "--> Server private key"
openssl ecparam -genkey -name prime256v1 -noout -out "$CERT_DIR/server.key"

echo "--> Server CSR"
openssl req -new \
  -key "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.csr" \
  -subj "/CN=superlink/O=FL-Health-Platform"

echo "--> Server certificate (signed by CA, with SANs)"
# SANs required by Go's crypto/tls (CN alone is ignored since Go 1.15)
SAN_EXT="$CERT_DIR/san.ext"
printf 'subjectAltName=DNS:localhost,DNS:superlink,IP:127.0.0.1\n' > "$SAN_EXT"
openssl x509 -req -days "$DAYS" \
  -in "$CERT_DIR/server.csr" \
  -CA "$CERT_DIR/ca.crt" \
  -CAkey "$CERT_DIR/ca.key" \
  -CAcreateserial \
  -extfile "$SAN_EXT" \
  -out "$CERT_DIR/server.crt" 2>/dev/null

# run.bash references server.pem — keep both names in sync
cp "$CERT_DIR/server.crt" "$CERT_DIR/server.pem"

# Clean up intermediate files
rm -f "$CERT_DIR/server.csr" "$CERT_DIR/ca.srl" "$SAN_EXT"

# ── PDP JWS Signing Key ────────────────────────────────────────────────────────

echo "--> PDP JWS signing key (EC P-256 / ES256)"
openssl ecparam -genkey -name prime256v1 -noout -out "$PDP_CERT_DIR/pdp_sign_key.pem"

echo "--> PDP JWS public key"
openssl ec -in "$PDP_CERT_DIR/pdp_sign_key.pem" \
  -pubout -out "$PDP_CERT_DIR/pdp_sign_pub.pem" 2>/dev/null

# ── Verify ─────────────────────────────────────────────────────────────────────

echo ""
echo "==> Verifying certificates"
openssl verify -CAfile "$CERT_DIR/ca.crt" "$CERT_DIR/server.crt" \
  && echo "    SuperLink server cert: OK"
openssl ec -in "$PDP_CERT_DIR/pdp_sign_key.pem" -check -noout 2>/dev/null \
  && echo "    PDP signing key: OK"

echo ""
echo "Done. Files written:"
ls -1 "$CERT_DIR"
ls -1 "$PDP_CERT_DIR"
