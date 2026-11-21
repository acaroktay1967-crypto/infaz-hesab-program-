'use strict';

// Masaüstü (Electron) sürümü – PWA ile aynı arayüzü ve aynı hesaplama motorunu
// (pwa-infaz.js) kullanır. Hesaplama sayfa içinde yapılır; IPC gerekmez.
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1150,
    height: 860,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'İnfaz Hesaplama Programı'
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
