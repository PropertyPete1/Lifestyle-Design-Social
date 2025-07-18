import { app, BrowserWindow } from 'electron';

function createWindow(): void {
  const win: BrowserWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    icon: undefined // Add app icon path here if available
  });

  // Point to the frontend running on localhost:3000 (Next.js)
  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev ? 'http://localhost:3000' : 'http://localhost:3000';
  
  win.loadURL(startUrl).catch((error: Error) => {
    console.error('Failed to load URL:', error);
    // Make sure the frontend server is running on port 3000
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });

  // Open DevTools in development
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Handle window closed
  win.on('closed', () => {
    // Dereference the window object
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
  });
}); 