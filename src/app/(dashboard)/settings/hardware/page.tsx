'use client';

import React, { useState, useEffect } from 'react';
import { hardwareService, HardwareConfig } from '@/services/hardwareService';
import { Printer, Usb, Keyboard, Save, CheckCircle2, AlertTriangle, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export default function HardwareSettingsPage() {
  const [config, setConfig] = useState<HardwareConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setConfig(hardwareService.getConfig());
  }, []);

  if (!config) return null;

  const handleSave = () => {
    setIsSaving(true);
    hardwareService.saveConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Hardware Configuration Saved', {
        description: 'New settings will apply to your next transaction.'
      });
    }, 500);
  };

  const handleTestCashDrawer = () => {
    hardwareService.kickCashDrawer();
    toast.info('Test Signal Sent', { description: 'Check if the Cash Drawer opened.' });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Monitor className="text-indigo-400" size={28} />
          Hardware Configuration
        </h1>
        <p className="text-gray-400 mt-2">
          Connect and configure physical store peripherals such as barcode scanners, thermal printers, and cash drawers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receipt Printer Section */}
        <div className="col-span-1 md:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Printer size={100} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Printer className="text-blue-400" /> Thermal Printer
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Printing Mode</label>
              <select 
                value={config.printerMode}
                onChange={e => setConfig({ ...config, printerMode: e.target.value as HardwareConfig['printerMode'] })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              >
                <option value="browser_print">Standard Browser Print (Easy)</option>
                <option value="raw_usb">Native WebUSB ESC/POS (Advanced)</option>
                <option value="qz_tray">QZ Tray Utility (Legacy / Ethernet)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Paper Width</label>
                <select 
                  value={config.paperWidth}
                  onChange={e => setConfig({ ...config, paperWidth: e.target.value as HardwareConfig['paperWidth'] })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="58mm">58mm (Small)</option>
                  <option value="80mm">80mm (Standard)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Interface / IP</label>
                <input 
                  type="text" 
                  value={config.printerTarget}
                  onChange={e => setConfig({ ...config, printerTarget: e.target.value })}
                  placeholder="e.g. 192.168.1.100 or 'default'"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cash Drawer Section */}
        <div className="col-span-1 border border-gray-800 rounded-2xl p-6 bg-gradient-to-b from-gray-900 to-gray-950 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Usb className="text-emerald-400" /> Cash Drawer
          </h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <div>
                <span className="block font-medium text-gray-200">Auto-Kick</span>
                <span className="text-xs text-gray-500">Open on Cash Sale</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={config.cashDrawerKick}
                  onChange={e => setConfig({ ...config, cashDrawerKick: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">ESC/POS Kick Code (HEX/DEC)</label>
              <input 
                type="text" 
                value={config.kickCode}
                onChange={e => setConfig({ ...config, kickCode: e.target.value })}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button 
              onClick={handleTestCashDrawer}
              className="w-full py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium mt-4 flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} className="text-yellow-500" />
              Test Kick Signal
            </button>
          </div>
        </div>

        {/* Global Barcode Scanner Section */}
        <div className="col-span-1 md:col-span-3 bg-indigo-950/20 border border-indigo-900/50 rounded-2xl p-6 shadow-xl flex items-start sm:items-center gap-6 flex-col sm:flex-row">
          <div className="p-4 bg-indigo-900/30 rounded-full shrink-0">
            <Keyboard className="text-indigo-400 w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">Global Barcode Scanning Active <CheckCircle2 className="text-emerald-500 w-5 h-5" /></h3>
            <p className="text-sm text-gray-400 mt-1">
              Your POS terminal is natively listening for high-speed scanner inputs globally. 
              You do NOT need to click inside a search bar to scan a product. Just scan and it will add to the cart automatically!
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-800 pt-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {isSaving ? 'Saving Hardware Profiles...' : 'Save Configuration'}
        </button>
      </div>

    </div>
  );
}
