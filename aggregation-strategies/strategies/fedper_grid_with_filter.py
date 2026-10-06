"""FedPer scheduling with fail-closed PEP checks at both FL lifecycle hooks."""

from flwr.app import ConfigRecord

from .fedavg_grid_with_filter import FedAvgGridWithFilter


class FedPerGridWithFilter(FedAvgGridWithFilter):
    """FedAvg over shared layers while clients retain their final layer locally.

    The accompanying client app honours ``fedper_personalize_last_layer`` by
    retaining the final linear layer in its local state and returning the
    unmodified global copy for that layer, so it is not averaged by the server.
    """

    def configure_train(self, server_round, arrays, config, grid):
        train_config = ConfigRecord({**dict(config), "fedper_personalize_last_layer": True})
        return super().configure_train(server_round, arrays, train_config, grid)

    def configure_evaluate(self, server_round, arrays, config, grid):
        evaluation_config = ConfigRecord({**dict(config), "fedper_personalize_last_layer": True})
        return super().configure_evaluate(server_round, arrays, evaluation_config, grid)
