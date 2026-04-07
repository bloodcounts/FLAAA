const { Router } = require('express');
const { StatusCodes } = require('http-status-codes');

const router = Router();

router.get('/health', (req, res) => {
  const { container, port } = req.app.locals;
  const ready = Boolean(container?.luas);
  // Return 200 for health checks - service is running even if still initializing
  res.status(StatusCodes.OK).json({
    status: ready ? 'ready' : 'initializing',
    port,
  });
});

module.exports = router;
