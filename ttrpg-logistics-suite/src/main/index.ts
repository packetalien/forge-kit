import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb } from './db/setup';
import { startApi } from './api/server';
import { debug } from '../shared/logger';

const TAG = 'Main';
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  debug(TAG, 'createWindow: creating BrowserWindow', { width: 1200, height: 800 });
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // vibrancy: 'fullscreen-ui', // macOS Tahoe Liquid Glass (enable when on Tahoe)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      webgpu: true,
      sandbox: true,
    },
    titleBarStyle: 'hidden',
    show: false,
  });

  if (process.env.NODE_ENV === 'development' || process.env.ELECTRON_VITE_DEV_SERVER_URL) {
    const url = process.env.ELECTRON_VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    debug(TAG, 'createWindow: loading dev URL', url);
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, '../renderer/index.html');
    debug(TAG, 'createWindow: loading file', filePath);
    mainWindow.loadFile(filePath);
  }

  mainWindow.once('ready-to-show', () => {
    debug(TAG, 'createWindow: ready-to-show');
    mainWindow?.show();
  });
  mainWindow.on('closed', () => {
    debug(TAG, 'createWindow: window closed');
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  debug(TAG, 'app.whenReady: starting initDb');
  await initDb();
  debug(TAG, 'app.whenReady: initDb done, starting API');
  startApi();
  debug(TAG, 'app.whenReady: creating window');
  createWindow();
});

app.on('window-all-closed', () => {
  debug(TAG, 'window-all-closed', { platform: process.platform });
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  debug(TAG, 'activate');
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('ping', () => {
  debug(TAG, 'IPC ping');
  return 'pong';
});
