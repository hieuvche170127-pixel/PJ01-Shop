// The current course-project build supports COD only. Online providers remain disabled
// until their callback verification and ownership checks have been implemented/reviewed.
const supportedPaymentMethods = Object.freeze(['COD']);
const onlinePaymentsEnabled = () => false;
const rejectOnlinePayment = (req, res) => res.status(404).json({
  success: false, message: 'Online payments are disabled in this COD demo',
});
module.exports = { supportedPaymentMethods, onlinePaymentsEnabled, rejectOnlinePayment };
