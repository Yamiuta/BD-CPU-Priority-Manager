/**
 * @name CPUPriorityManager
 * @version 1.2.0
 * @description A plugin to manage CPU priority for Discord.
 * @source https://github.com/Yamiuta/BD-CPU-Priority-Manager
 * @updateUrl https://github.com/Yamiuta/BD-CPU-Priority-Manager/update
 */

module.exports = (() => {
    const config = {
        info: {
            name: "CPUPriorityManager",
            author: "Yamiuta",
            version: "1.2.0",
            description: "A plugin to manage CPU priority for Discord."
        }
    };

    return class CPUPriorityManager {
        constructor() {
            this.settings = { priority: 'normal' };
            this.interval = null;
            this.pids = [];
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
            BdApi.NativeModules.requireModule("child_process").exec(`wmic process where "name like 'Discord%'" get ProcessId`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`${config.info.name}: Failed to scan processes`, error);
                    return;
                }
                this.pids = stdout.split('\n')
                    .filter(line => line.trim() && !isNaN(line.trim()))
                    .map(pid => pid.trim());
                callback(this.pids);
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
            this.pids.forEach(pid => {
                BdApi.NativeModules.requireModule("child_process").exec(`wmic process where ProcessId=${pid} CALL setpriority ${priority}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`${config.info.name}: Failed to set priority for PID ${pid}`, error);
                    } else {
                        console.log(`${config.info.name}: Priority set to ${priority} for PID ${pid}`, stdout);
                    }
                });
            });
        }

        resetPriori
