'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('infazAPI', {
  hesapla:         (params) => ipcRenderer.invoke('infaz:hesapla', params),
  donemHesapla:    (params) => ipcRenderer.invoke('infaz:donemHesapla', params),
  leheKarsilastir: (params) => ipcRenderer.invoke('infaz:leheKarsilastir', params),
  yeniHesapla:     (params) => ipcRenderer.invoke('infaz:yeniHesapla', params)
});
