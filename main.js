'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1150,
    height: 860,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'İnfaz Hesaplama Programı'
  });

  win.loadFile('renderer/index.html');
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

// IPC: Ana infaz hesaplama
ipcMain.handle('infaz:hesapla', async (_event, params) => {
  try {
    const infaz = require('./src/infaz');
    const sonuc = infaz.infazHesapla(params);
    return { success: true, data: sonuc };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Dönemlerden toplam infaz süresi
ipcMain.handle('infaz:donemHesapla', async (_event, params) => {
  try {
    const infaz = require('./src/infaz');
    const sonuc = infaz.donemHesapla(params.donemler, params.excludeIndex);
    return { success: true, data: sonuc };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Lehe yasa karşılaştırması
ipcMain.handle('infaz:leheKarsilastir', async (_event, params) => {
  try {
    const infaz = require('./src/infaz');
    const sonuc = infaz.leheKarsilastirma(params);
    return { success: true, data: sonuc };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC: Suç tarihine göre yeni infaz hesaplama
ipcMain.handle('infaz:yeniHesapla', async (_event, params) => {
  try {
    const infaz = require('./src/infaz');
    const sonuc = infaz.yeniInfazHesapla(params);
    return { success: true, data: sonuc };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
