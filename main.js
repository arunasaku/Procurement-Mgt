const fs = require('fs');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Remove the menu bar
    mainWindow.setMenuBarVisibility(false);
    
    // Disable Developer Tools for production (optional, good for security)
    // mainWindow.webContents.on('devtools-opened', () => { mainWindow.webContents.closeDevTools(); });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Helper for data file path
function getDataFilePath() {
    const docPath = app.getPath('documents');
    const folderPath = path.join(docPath, 'Procurement_System_Data');
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    return path.join(folderPath, 'database.json');
}

// IPC Handlers
ipcMain.handle('get-machine-id', async () => {
    try {
        return machineIdSync();
    } catch (e) {
        return "UNKNOWN-MACHINE";
    }
});

ipcMain.handle('load-data', async () => {
    const filePath = getDataFilePath();
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return null; // Return null if no file or error
});

ipcMain.handle('save-data', async (event, dataObject) => {
    const filePath = getDataFilePath();
    try {
        fs.writeFileSync(filePath, JSON.stringify(dataObject, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Error saving data:', error);
        return { success: false, error: error.message };
    }
});
