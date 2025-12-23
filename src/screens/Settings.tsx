import { GameSettings } from '../engine/types';
import { Button } from '../components/Button';
import styles from './Settings.module.css';

interface SettingsProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onBack: () => void;
}

export function Settings({ settings, onUpdateSettings, onBack }: SettingsProps) {
  const toggleSetting = (key: keyof GameSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const updateTheme = (theme: 'charcoal' | 'high-contrast') => {
    onUpdateSettings({
      ...settings,
      theme,
    });

    document.body.setAttribute('data-theme', theme === 'high-contrast' ? 'high-contrast' : '');
  };

  return (
    <div className={styles.settings}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Mandatory Captures</div>
              <div className={styles.settingDescription}>
                When enabled, you must capture if a capture move is available
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.mandatoryCaptures ? styles.active : ''}`}
              onClick={() => toggleSetting('mandatoryCaptures')}
            >
              <div className={styles.toggleKnob} />
            </div>
          </div>

          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Move Hints</div>
              <div className={styles.settingDescription}>
                Show valid move indicators when a piece is selected
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.showHints ? styles.active : ''}`}
              onClick={() => toggleSetting('showHints')}
            >
              <div className={styles.toggleKnob} />
            </div>
          </div>

          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Sound</div>
              <div className={styles.settingDescription}>
                Play sound effects for moves and captures
              </div>
            </div>
            <div
              className={`${styles.toggle} ${settings.soundEnabled ? styles.active : ''}`}
              onClick={() => toggleSetting('soundEnabled')}
            >
              <div className={styles.toggleKnob} />
            </div>
          </div>

          <div className={styles.setting}>
            <div className={styles.settingInfo}>
              <div className={styles.settingLabel}>Theme</div>
              <div className={styles.settingDescription}>
                Choose your preferred color scheme
              </div>
            </div>
            <select
              className={styles.select}
              value={settings.theme}
              onChange={(e) => updateTheme(e.target.value as 'charcoal' | 'high-contrast')}
            >
              <option value="charcoal">Charcoal</option>
              <option value="high-contrast">High Contrast</option>
            </select>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onBack} variant="primary">
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
