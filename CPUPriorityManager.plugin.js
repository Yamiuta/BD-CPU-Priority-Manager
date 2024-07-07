/**
 * @name CPUPriorityManager
 * @author Gio
 * @version 1.0.0
 * @description A plugin to manage CPU priority for Discord.
 * @source https://github.com/Yamiuta/BD-CPU-Priority-Manager
 * @updateUrl https://github.com/Yamiuta/BD-CPU-Priority-Manager/update
 */

module.exports = (() => {
    const config = {
        info: {
            name: "CPUPriorityManager",
            author: "Gio",
            version: "1.0.0",
            description: "A plugin to manage CPU priority for Discord."
        }
    };

    return class CPUPriorityManager {
        constructor() {
            this.settings = { priority: 'normal' };
        }

        getName() { return config.info.name; }
        getAuthor() { return config.info.author; }
        getVersion() { return config.info.version; }
        getDescription() { return config.info.description; }

        start() {
            this.loadSettings();
            this.setPriority();
            this.monitorProcesses();
        }

        stop() {
            this.resetPriority();
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
            select.addEventListener('change', () => this.saveSettings(select.value));

            return settingsPanel;
        }

        loadSettings() {
            const savedSettings = BdApi.loadData(config.info.name, 'settings');
            if (savedSettings) {
                this.settings = savedSettings;
            }
        }

        saveSettings(priority) {
            this.settings.priority = priority;
            BdApi.saveData(config.info.name, 'settings', this.settings);
            this.setPriority();
        }

        setPriority() {
            const { exec } = require('child_process');
            const priorityMap = {
                'idle': 'idle',
                'below normal': 'belownormal',
                'normal': 'normal',
                'above normal': 'abovenormal',
                'high': 'high',
                'realtime': 'realtime'
            };
            const priority = priorityMap[this.settings.priority] || 'normal';
            exec(`wmic process where name="Discord.exe" CALL setpriority ${priority}`);
        }

        resetPriority() {
            const { exec } = require('child_process');
            exec(`wmic process where name="Discord.exe" CALL setpriority "normal"`);
        }

        monitorProcesses() {
            this.interval = setInterval(() => {
                this.setPriority();
            }, 5000);
        }

        disableBackgroundRendering() {
            // Add code to disable background rendering
        }
    };
})();
