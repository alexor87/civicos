import { SettingsTabs } from '@/components/settings/SettingsTabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-[#1b1f23]">Configuración</h1>
          <p className="text-sm text-[#6a737d] mt-0.5">Gestiona tu campaña, equipo e integraciones</p>
        </div>

        {/* Tab nav */}
        <SettingsTabs />

        {/* Content */}
        <div className="bg-white rounded-md border border-[#dcdee6] p-6">
          {children}
        </div>

      </div>
    </div>
  )
}
