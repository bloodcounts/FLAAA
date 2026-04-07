const { Router } = require('express');
const { StatusCodes } = require('http-status-codes');
const { validateDecisionQuery } = require('../middleware/validate');

const router = Router();

router.get('/getDecision', validateDecisionQuery, async (req, res, next) => {
  try {
    const { container } = req.app.locals;
    const { luas } = container;
    if (!luas) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: 'PDP not initialized yet' });
    }

    const requestXml = container.decisionParamsBuilder.build(req.query.action, req.query);
    if (!requestXml) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Could not build XACML request — check task_id / node_id exist in policy data',
      });
    }

    const decision = await luas.evaluates(requestXml);
    return res.json({ decision });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
