import { hardwareService } from './hardwareService';
import { format } from 'date-fns';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number; // Single item price
  total: number;
}

export interface ReceiptData {
  tenantName: string;
  branchName: string;
  cashierName: string;
  transactionId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  tendered: number;
  change: number;
}

/**
 * Enterprise ESC/POS and Thermal Browser Printing Engine.
 */
export const receiptPrinterService = {
  
  /**
   * Generates a thermal-friendly HTML receipt and opens the browser's print dialog.
   * This handles standard EPSON/BIXOLON 80mm & 58mm CSS dimensions automatically.
   */
  printBrowserReceipt(data: ReceiptData) {
    const config = hardwareService.getConfig();
    const widthPixels = config.paperWidth === '80mm' ? '300px' : '200px';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      console.error('Failed to open print window. Pop-up blocker might be active.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${data.transactionId}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${widthPixels};
              margin: 0;
              padding: 10px;
              font-size: 12px;
              color: black;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .dashes { border-bottom: 1px dashed black; margin: 8px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 2px 0; }
            .td-qty { width: 15%; }
            .td-price { text-align: right; width: 25%; }
            .total-section { font-size: 14px; margin-top: 10px; }
            .footer { margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold uppercase" style="font-size: 16px;">
            ${data.tenantName}
          </div>
          <div class="text-center">${data.branchName}</div>
          <div class="dashes"></div>
          
          <div class="flex-between">
            <span>Date: ${format(new Date(), 'dd/MM/yyyy')}</span>
            <span>Time: ${format(new Date(), 'HH:mm')}</span>
          </div>
          <div class="flex-between">
            <span>Cashier: ${data.cashierName.split(' ')[0]}</span>
            <span>TXN: ${data.transactionId.substring(0, 8)}</span>
          </div>
          
          <div class="dashes"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="td-qty">Qty</th>
                <th class="td-price">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name.substring(0, 15)}</td>
                  <td class="td-qty">${item.quantity}</td>
                  <td class="td-price">${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="dashes"></div>

          <div class="flex-between">
            <span>Subtotal:</span>
            <span>LKR ${data.subtotal.toFixed(2)}</span>
          </div>
          ${data.tax > 0 ? `
            <div class="flex-between">
              <span>Tax (Included):</span>
              <span>LKR ${data.tax.toFixed(2)}</span>
            </div>
          ` : ''}
          ${data.discount > 0 ? `
            <div class="flex-between">
              <span>Discount:</span>
              <span>-LKR ${data.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          
          <div class="flex-between font-bold total-section">
            <span style="font-size: 16px;">TOTAL:</span>
            <span style="font-size: 16px;">LKR ${data.total.toFixed(2)}</span>
          </div>

          <div class="dashes"></div>
          <div class="flex-between">
            <span>Paid By:</span>
            <span>${data.paymentMethod}</span>
          </div>
          <div class="flex-between">
            <span>Tendered:</span>
            <span>LKR ${data.tendered.toFixed(2)}</span>
          </div>
          <div class="flex-between font-bold">
            <span>Change:</span>
            <span>LKR ${data.change.toFixed(2)}</span>
          </div>

          <div class="dashes"></div>
          
          <div class="footer text-center">
            <p>Thank you for shopping with us!</p>
            <p>Please keep this receipt for your records.</p>
            <p>Powered by Lumora POS</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  /**
   * Final checkout trigger that handles both drawer kicks and printing combined.
   */
  async processHardwareCheckoutActions(data: ReceiptData) {
    const config = hardwareService.getConfig();
    
    // 1. Kick the drawer if enabled
    if (config.cashDrawerKick) {
      hardwareService.kickCashDrawer();
    }

    // 2. Print receipt based on mode
    if (config.printerMode === 'browser_print') {
      this.printBrowserReceipt(data);
    } else {
      console.warn(`Printer mode ${config.printerMode} is currently falling back to browser print in development.`);
      this.printBrowserReceipt(data);
    }
  }
};
