import type { Context } from '@deepseek-ai/cordis'
import * as settingsApi from '@deepseek-ai/dsh-settings'
import type { SettingsNamespace, SettingsSectionHooks } from '@deepseek-ai/dsh-settings'
import type z from '@deepseek-ai/schemastery'
import { SETTINGS_NS } from './config.ts'

// This fixed, valid namespace is accepted directly by the rc.1 service API.
export const SETTINGS_NAMESPACE = SETTINGS_NS as SettingsNamespace

type InstallSection = <T>(
  owner: Context, ns: SettingsNamespace, schema: z<T>, entry: T, hooks: SettingsSectionHooks<T>,
) => void

export function installSettingsSection<T>(
  owner: Context, ns: SettingsNamespace, schema: z<T>, entry: T, hooks: SettingsSectionHooks<T>,
): void {
  // Reflect keeps the optional legacy export from becoming a required ESM import.
  const legacy = Reflect.get(settingsApi, 'installSettingsSection') as InstallSection | undefined
  if (typeof legacy === 'function') {
    legacy(owner, ns, schema, entry, hooks)
    return
  }
  owner.inject(['settings'], scoped => {
    const settings = scoped.settings as typeof scoped.settings & { installSection?: InstallSection }
    if (typeof settings.installSection !== 'function') {
      throw new Error('dsh-anyrouter: unsupported settings API; expected the legacy helper or rc.1 settings.installSection')
    }
    settings.installSection(owner, ns, schema, entry, hooks)
  })
}
