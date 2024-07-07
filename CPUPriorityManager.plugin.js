/**
 * @name CPUPriorityManager
 * @author Yamiuta
 * @version 1.1.0
 * @description A plugin to manage CPU priority for Discord.
 * @source https://github.com/Yamiuta/BD-CPU-Priority-Manager
 * @updateUrl https://github.com/Yamiuta/BD-CPU-Priority-Manager/update
 */

module.exports = (() => {
    const config = {
        info: {
            name: "CPUPriorityManager",
            author: "Yamiuta",
            version: "1.1.0",
            description: "A plugin to manage CPU priority for Discord."
        }
    };

    const { exec } = require('child_process');

    return class CPUPriorityManager {
        constructor() {
            this.settings = { priority: 'normal' };
            this.interval = null;
        }

        getName() { return config.info.name; }
        getAuthor() { return config.info.author; }
        getVersion() { return config.info.version; }
        getDescription() { return config.info.description; }

        loadSettings() {
            try {
                const savedSettings = BdApi.loadData(config.info.name, 'settings');
                if (savedSettings) {
                    this.settings = savedSettings;
                }
                BdApi.showToast(`${config.info.name}: Settings loaded`, { type: 'info' });
            } catch (error) {
                console.error(`${config.info.name}: Failed to load settings`, error);
            }
        }

        saveSettings(priority) {
            try {
                this.settings.priority = priority;
                BdApi.saveData(config.info.name, 'settings', this.settings);
                this.setPriority();
                BdApi.showToast(`${config.info.name}: Settings saved`, { type: 'success' });
            } catch (error) {
                console.error(`${config.info.name}: Failed to save settings`, error);
            }
        }

        scanDiscordProcesses(callback) {
            exec(`wmic process where "name like 'Discord%'" get ProcessId`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`${config.info.name}: Failed to scan processes`, error);
                    return;
                }
                const pids = stdout.split('\n')
                    .filter(line => line.trim() && !isNaN(line.trim()))
                    .map(pid => pid.trim());
                callback(pids);
            });
        }

        setPriority() {
            const priorityMap = {
                'idle': 'idle',
                'below normal': 'belownormal',
                'normal': 'normal',
                'above normal': 'abovenormal',
                'high': 'high',
                'realtime': 'realtime'
            };
            const priority = priorityMap[this.settings.priority] || 'normal';
            this.scanDiscordProcesses((pids) => {
                pids.forEach(pid => {
                    exec(`wmic process where ProcessId=${pid} CALL setpriority ${priority}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`${config.info.name}: Failed to set priority for PID ${pid}`, error);
                        } else {
                            console.log(`${config.info.name}: Priority set to ${priority} for PID ${pid}`, stdout);
                        }
                    });
                });
            });
        }

        resetPriority() {
            this.scanDiscordProcesses((pids) => {
                pids.forEach(pid => {
                    exec(`wmic process where ProcessId=${pid} CALL setpriority "normal"`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`${config.info.name}: Failed to reset priority for PID ${pid}`, error);
                        } else {
                            console.log(`${config.info.name}: Priority reset to normal for PID ${pid}`, stdout);
                        }
                    });
                });
            });
        }

        start() {
            try {
                this.loadSettings();
                this.setPriority();
                this.monitorProcesses();
                BdApi.showToast(`${config.info.name}: Started`, { type: 'success' });
            } catch (error) {
                console.error(`${config.info.name}: Failed to start`, error);
            }
        }

        stop() {
            try {
                clearInterval(this.interval);
                this.resetPriority();
                BdApi.showToast(`${config.info.name}: Stopped`, { type: 'info' });
            } catch (error) {
                console.error(`${config.info.name}: Failed to stop`, error);
            }
        }

        monitorProcesses() {
            this.interval = setInterval(() => {
                this.setPriority();
            }, 5000);
        }

        getSettingsPanel() {
            const settingsPanel = document.createElement('div');
            settingsPanel.innerHTML = `
                <h3>CPU Priority Manager Settings</h3>
                <label for="priority">CPU Priority:</label>
                <select id="priority">
                    <option value="idle">Idle</option>
                    <option value="below normal">Below Normal</option>
                    <option value="normal">Normal</option>
                    <option value="above normal">Above Normal</option>
                    <option value="high">High</option>
                    <option value="realtime">Realtime</option>
                </select>
            `;

            const select = settingsPanel.querySelector('#priority');
            select.value = this.settings.priority;
            select.addEventListener('change', (event) => {
                this.saveSettings(event.target.value);
            });

            return settingsPanel;
        }
    };
})();
