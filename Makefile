# ── FLAAA Platform Makefile ──────────────────────────────────────
PLATFORM_COMPOSE = docker-compose.tls.platform.yml
CLIENT_COMPOSE   = docker-compose.yml
PLATFORM_PROJECT = flaaa-platform
CLIENT_PROJECT   = flaaa-client

# Detect NVIDIA runtime support (macOS has no nvidia-container-runtime)
HAS_NVIDIA := $(shell docker info 2>/dev/null | grep -q nvidia && echo 1 || echo 0)

.PHONY: help up up-platform up-client down down-platform down-client \
        build logs logs-platform logs-client shell-superlink shell-pdp \
        shell-client fresh clean test-unit test-conformance

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Platform (SuperLink + PDP + certs + node-registration) ──────
up-platform: ## Start platform services (TLS)
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) up -d --build

up-client: ## Start the PyTorch client container
ifeq ($(HAS_NVIDIA),1)
	docker compose -p $(CLIENT_PROJECT) -f $(CLIENT_COMPOSE) up -d --build
else
	@echo "⚠️  NVIDIA runtime not available (macOS?) — starting CPU-only container"
	-docker rm -f pytorch-container 2>/dev/null
	docker run -d --name pytorch-container \
		-v $(CURDIR):/workspace -w /workspace \
		--shm-size 2g \
		pytorch/pytorch:latest sleep infinity
endif

up: up-platform up-client ## Start everything (platform + client)

down-platform: ## Stop platform services
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) down

down-client: ## Stop client container
ifeq ($(HAS_NVIDIA),1)
	docker compose -p $(CLIENT_PROJECT) -f $(CLIENT_COMPOSE) down
else
	-docker compose -p $(CLIENT_PROJECT) -f $(CLIENT_COMPOSE) down 2>/dev/null
	-docker rm -f pytorch-container 2>/dev/null
endif

down: down-client down-platform ## Stop everything

# ── Build ───────────────────────────────────────────────────────
build: ## Rebuild all images
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) build
ifeq ($(HAS_NVIDIA),1)
	docker compose -p $(CLIENT_PROJECT) -f $(CLIENT_COMPOSE) build
endif

# ── Fresh start ─────────────────────────────────────────────────
fresh: down ## Full teardown + rebuild + start
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) down -v --remove-orphans 2>/dev/null || true
	rm -rf certificates/ pdp/certs/
	$(MAKE) up

clean: ## Remove everything including volumes and images
	-docker compose -p $(CLIENT_PROJECT) -f $(CLIENT_COMPOSE) down -v --rmi all --remove-orphans 2>/dev/null
	-docker rm -f pytorch-container 2>/dev/null
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) down -v --rmi all --remove-orphans
	rm -rf certificates/ pdp/certs/

# ── Logs ────────────────────────────────────────────────────────
logs: ## Tail all platform logs
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) logs -f

logs-platform: logs ## Alias for logs

logs-client: ## Tail client container logs
	docker logs -f pytorch-container

# ── Shell access ────────────────────────────────────────────────
shell-superlink: ## Shell into superlink
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) exec superlink bash

shell-pdp: ## Shell into PDP
	docker compose -p $(PLATFORM_PROJECT) -f $(PLATFORM_COMPOSE) exec pdp sh

shell-client: ## Shell into client container
	docker exec -it pytorch-container bash

# ── Training ────────────────────────────────────────────────────
run: ## Run FL training (from inside client or locally)
	cd examples && flwr run .

run-docker: ## Run FL training inside the client container
	docker exec -w /workspace/examples pytorch-container bash -c \
		"pip install -e . 'flwr[simulation]' && PYTHONPATH=/workspace/examples flwr run . 2>&1"

run-docker-logs: ## Tail Flower simulation logs (superlink + workers)
	docker exec pytorch-container bash -c \
		'tail -f /root/.flwr/local-superlink/superlink.log /tmp/ray/session_latest/logs/worker-*.err 2>/dev/null'

# ── Tests ───────────────────────────────────────────────────────
test-unit: ## Run aggregation strategy unit tests
	@if [ -d aggregation-strategies/tests ]; then \
		docker run --rm -v $(CURDIR):/workspace -w /workspace/aggregation-strategies python:3.12-slim sh -c \
			"pip install --no-cache-dir pytest >/dev/null && python -m pytest tests/ -v"; \
	else \
		echo "No aggregation-strategies/tests directory found; skipping unit tests."; \
	fi

test-conformance: ## Run PDP XACML conformance tests
	cd pdp && [ -d node_modules ] || npm ci
	cd pdp && npm run conformance

test: test-unit test-conformance ## Run all tests
