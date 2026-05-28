let intervalId = null;
let mainWindow = null;

function setWindow(win) {
  mainWindow = win;
}

function start(intervalMinutes, callback) {
  stop();
  if (!intervalMinutes || intervalMinutes <= 0) return;
  const ms = intervalMinutes * 60 * 1000;
  intervalId = setInterval(async () => {
    try {
      await callback();
      if (mainWindow) {
        mainWindow.webContents.send('data-refreshed', { time: new Date().toISOString() });
      }
    } catch (err) {
      console.error('自动刷新失败:', err.message);
    }
  }, ms);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function isRunning() {
  return intervalId !== null;
}

module.exports = { start, stop, isRunning, setWindow };
