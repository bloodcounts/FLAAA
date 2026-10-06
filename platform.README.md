# Platform services

`docker-compose.tls.platform.yml` runs the PDP, custom Flower SuperLink, development certificate setup and node-registration helper. `make up-platform` starts these services. `make down-platform` stops them.

The PDP serves HTTPS on port 8080. SuperLink serves Fleet on 9092 and Control on 9093 with TLS; the Runtime HTTP API listens on 9091. Restrict runtime API access to application processes within the coordinator environment.

The certificate helper creates a local development CA, TLS certificates for SuperLink and the PDP, and a separate P-256 audit signing key. Repeated runs preserve existing keys and certificates. Production deployments should supply institution-managed credentials and retain their public-key history.

The TLS Compose configuration requires ES256 accounting and writes local runtime artifacts to `pdp/logs/`, `pdp/checkpoints/` and `superlink-data/`. Public-key identifiers and the policy version are configured in the service environment. Retain checkpoint copies in independent trusted storage for audit verification.

The node-registration helper grants its generated example nodes participant membership in a local policy-information file. Review that file before running a deployed study, and provision actual site approvals and memberships through the operator's governance process. The application does not automatically register discovered nodes unless its simulation option is enabled explicitly.

Patient data are not part of any image or source snapshot. Supply prepared partitions separately at each authorised site and set `INTERVAL_DATA_DIR` for its ClientApp. See [examples/README.md](examples/README.md) for synthetic runs and private preprocessing, and [pdp/README.md](pdp/README.md) for HTTPS, policy and signed-audit settings.
