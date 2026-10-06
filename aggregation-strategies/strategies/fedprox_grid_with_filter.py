"""FedProx scheduling with the same fail-closed PEP checks as FedAvg."""

from flwr.app import ConfigRecord

from .fedavg_grid_with_filter import FedAvgGridWithFilter


class FedProxGridWithFilter(FedAvgGridWithFilter):
    """FedAvg aggregation plus a proximal term applied by compatible clients.

    The PEP filtering is inherited for both task scheduling and reply
    aggregation.  ``proximal_mu`` is injected into each train message; the
    client app applies it against the received global parameters.
    """

    def __init__(self, access_validator, federation: str, proximal_mu: float = 0.01, **kwargs):
        if proximal_mu < 0:
            raise ValueError("proximal_mu must be non-negative")
        super().__init__(access_validator=access_validator, federation=federation, **kwargs)
        self.proximal_mu = float(proximal_mu)

    def configure_train(self, server_round, arrays, config, grid):
        train_config = ConfigRecord({**dict(config), "proximal_mu": self.proximal_mu})
        return super().configure_train(server_round, arrays, train_config, grid)
