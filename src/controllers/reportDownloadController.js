const { report } = require('../services/salesReport');
const { respondError } = require('../utils/apiError');
function cell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
exports.download = async (req, res) => {
  try {
    const data = await report(req.user.id, req.query);
    const rows = [
      ['Báo cáo demo Shopii', 'VND'],
      ['Cơ sở', 'Tiền đã thu sau giảm giá, theo ngày đặt đơn (giờ Việt Nam); không phải sổ hoàn tiền'],
      ['Đã thu', data.totalRevenue], ['Đã giao sau giảm giá', data.totalDeliveredPayable],
      ['Còn phải thu', data.totalOutstanding], ['Dữ liệu lịch sử cần kiểm tra', data.legacyIssueCount],
      [], ['Ngày đặt đơn', 'Đã thu sau giảm giá'], ...data.revenueOverTime.map(row => [row.date, row.revenue]),
      [], ['Top sản phẩm đã thu', 'Số lượng', 'Đã thu'], ...data.topProducts.map(row => [row.product, row.quantity, row.revenue])
    ];
    res.set('Content-Disposition', 'attachment; filename="shopii-sales-report.csv"');
    res.set('Cache-Control', 'no-store');
    res.type('text/csv').send('\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n'));
  } catch (error) { respondError(res, error); }
};
exports.cell = cell;
