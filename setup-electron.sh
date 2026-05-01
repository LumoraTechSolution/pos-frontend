#!/bin/bash
# Quick-start script for Electron desktop app setup
# Run from: cd frontend && bash setup-electron.sh

echo "🚀 Setting up Lumora POS Electron Desktop App..."

# Step 1: Install dependencies
echo "📦 Installing Electron dependencies..."
npm install --save-dev \
  electron \
  electron-builder \
  electron-is-dev \
  electron-squirrel-startup \
  concurrently \
  wait-on \
  @types/node \
  typescript

npm install \
  serialport \
  usb

# Step 2: Create directory structure
echo "📁 Creating Electron directory structure..."
mkdir -p electron/hardware
mkdir -p electron/utils

# Step 3: Create Electron main files
echo "✨ Creating Electron main process..."

cat > electron/main.ts << 'EOF'
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { setupIPC } from './ipc';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

setupIPC(mainWindow);

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.on('ready', createMenu);
EOF

echo "✨ Creating Preload script..."

cat > electron/preload.ts << 'EOF'
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  hardware: {
    getPrinters: () => Promise<string[]>;
    printReceipt: (data: string) => Promise<boolean>;
    openCashDrawer: () => Promise<boolean>;
    scanBarcode: () => Promise<string>;
  };
  file: {
    selectFile: (filters: any[]) => Promise<string>;
    exportData: (path: string, data: string) => Promise<boolean>;
  };
  system: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };
}

const electronAPI: ElectronAPI = {
  hardware: {
    getPrinters: () => ipcRenderer.invoke('hardware:get-printers'),
    printReceipt: (data) => ipcRenderer.invoke('hardware:print-receipt', data),
    openCashDrawer: () => ipcRenderer.invoke('hardware:open-drawer'),
    scanBarcode: () => ipcRenderer.invoke('hardware:scan-barcode'),
  },
  file: {
    selectFile: (filters) => ipcRenderer.invoke('file:select-file', filters),
    exportData: (path, data) => ipcRenderer.invoke('file:export-data', { path, data }),
  },
  system: {
    minimize: () => ipcRenderer.send('system:minimize'),
    maximize: () => ipcRenderer.send('system:maximize'),
    close: () => ipcRenderer.send('system:close'),
    isMaximized: () => ipcRenderer.invoke('system:is-maximized'),
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
EOF

echo "✨ Creating IPC setup..."

cat > electron/ipc.ts << 'EOF'
import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs';

export const setupIPC = (mainWindow: BrowserWindow | null) => {
  // Hardware: Printer
  ipcMain.handle('hardware:get-printers', async () => {
    // TODO: Implement printer discovery
    return [];
  });

  ipcMain.handle('hardware:print-receipt', async (event, receiptData) => {
    try {
      // TODO: Implement actual printing
      console.log('Print receipt:', receiptData);
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  });

  // Hardware: Cash Drawer
  ipcMain.handle('hardware:open-drawer', async () => {
    try {
      // TODO: Implement drawer control
      console.log('Opening cash drawer');
      return true;
    } catch (error) {
      console.error('Drawer error:', error);
      return false;
    }
  });

  // Hardware: Barcode Scanner
  ipcMain.handle('hardware:scan-barcode', async () => {
    // TODO: Implement scanner integration
    return '';
  });

  // File operations
  ipcMain.handle('file:select-file', async (event, filters) => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
      filters,
      properties: ['openFile'],
    });
    return filePaths[0] || null;
  });

  ipcMain.handle('file:export-data', async (event, { filePath, data }) => {
    try {
      fs.writeFileSync(filePath, data);
      return true;
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  });

  // System control
  ipcMain.on('system:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('system:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('system:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('system:is-maximized', () => {
    return mainWindow?.isMaximized() || false;
  });
};
EOF

echo "✨ Creating useElectron hook..."

mkdir -p src/hooks
cat > src/hooks/useElectron.ts << 'EOF'
import { useCallback } from 'react';

export const useElectron = () => {
  const isElectron = typeof window !== 'undefined' && (window as any).electron;

  const printReceipt = useCallback(async (receiptHTML: string): Promise<boolean> => {
    if (!isElectron) return false;
    return (window as any).electron.hardware.printReceipt(receiptHTML);
  }, [isElectron]);

  const openCashDrawer = useCallback(async (): Promise<boolean> => {
    if (!isElectron) return false;
    return (window as any).electron.hardware.openCashDrawer();
  }, [isElectron]);

  const scanBarcode = useCallback(async (): Promise<string> => {
    if (!isElectron) return '';
    return (window as any).electron.hardware.scanBarcode();
  }, [isElectron]);

  const getPrinters = useCallback(async (): Promise<string[]> => {
    if (!isElectron) return [];
    return (window as any).electron.hardware.getPrinters();
  }, [isElectron]);

  const minimize = useCallback(() => {
    if (isElectron) (window as any).electron.system.minimize();
  }, [isElectron]);

  const maximize = useCallback(() => {
    if (isElectron) (window as any).electron.system.maximize();
  }, [isElectron]);

  const close = useCallback(() => {
    if (isElectron) (window as any).electron.system.close();
  }, [isElectron]);

  return {
    isElectron,
    printReceipt,
    openCashDrawer,
    scanBarcode,
    getPrinters,
    minimize,
    maximize,
    close,
  };
};
EOF

echo "✨ Creating electron-builder config..."

cat > electron-builder.config.js << 'EOF'
module.exports = {
  appId: 'com.lumora.pos',
  productName: 'Lumora POS',
  directories: {
    buildResources: 'public',
    output: 'dist',
  },
  files: [
    'out/**/*',
    'electron/**/*',
    'node_modules/**/*',
    'package.json',
  ],
  win: {
    target: ['nsis', 'portable'],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.productivity',
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility',
  },
};
EOF

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update package.json scripts:"
echo "   npm scripts should include:"
echo "   - 'dev': 'concurrently \"npm run next-dev\" \"npm run electron-dev\"'"
echo "   - 'electron-dev': 'wait-on http://localhost:3000 && electron .'"
echo "   - 'build': 'npm run next-build && npm run electron-build'"
echo ""
echo "2. Update next.config.mjs:"
echo "   output: 'export'"
echo "   distDir: 'out'"
echo ""
echo "3. Run: npm run dev"
echo ""
echo "🎉 Ready to start building!"
