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
    // Every externally served decision gets a signed audit record when the
    // deployment requires ES256 signing.  A signing/audit failure is a PDP
    // failure rather than an unsigned Permit.
    if (container.loggerInstance) {
      container.loggerInstance.log(
        decision,
        null,
        {
          action: req.query.action,
          task_id: req.query.task_id,
          node_id: req.query.node_id,
          policy: container.policyMetadata,
          request_xml: requestXml,
        },
      );
    }
    const response = { decision };
    if (container.policyMetadata) response.policy = container.policyMetadata;
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
