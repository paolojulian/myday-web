import SwiftUI

/// Settings (mockup 12): Categories, iCloud sync status, version.
struct SettingsScreen: View {
    static func versionText(info: [String: Any]?) -> String {
        "Version \(info?["CFBundleShortVersionString"] as? String ?? "–")"
    }

    static func syncColor(_ status: SyncStatus) -> Color {
        status == .on ? Theme.Colors.success : Theme.Colors.textSubtle
    }

    @Environment(\.storeMode) private var storeMode
    @Environment(\.scenePhase) private var scenePhase
    @State private var hasICloudAccount = FileManager.default.ubiquityIdentityToken != nil

    var body: some View {
        let sync = SyncStatus.current(mode: storeMode, hasICloudAccount: hasICloudAccount)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Settings").themeLabel()
                    Spacer(minLength: 0)
                    Text(Self.versionText(info: Bundle.main.infoDictionary)).themeLabel()
                }

                SectionRule("Manage").padding(.top, Theme.Spacing.block)
                NavigationLink {
                    CategoriesScreen()
                } label: {
                    SettingsRow(title: "Categories", caption: "Add, review, and remove expense categories") {
                        Image(systemName: "chevron.right")
                            .font(Theme.Fonts.small)
                            .foregroundStyle(Theme.Colors.textSubtle)
                            .accessibilityHidden(true)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("settings-categories")

                SectionRule("iCloud sync").padding(.top, Theme.Spacing.section)
                SettingsRow(title: "Sync across your devices",
                            caption: "Expenses and receipts are kept in your iCloud") { EmptyView() }
                StatusText(sync.title, color: Self.syncColor(sync))
                    .padding(.top, Theme.Spacing.tight)
            }
            .screenMargins()
            .padding(.vertical, Theme.Spacing.block)
        }
        .background(Theme.Colors.background)
        .toolbar(.hidden, for: .navigationBar)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { hasICloudAccount = FileManager.default.ubiquityIdentityToken != nil }
        }
    }
}

/// Title, caption and a trailing accessory on one ruled row.
struct SettingsRow<Trailing: View>: View {
    let title: String
    let caption: String
    @ViewBuilder let trailing: Trailing

    var body: some View {
        HStack(spacing: Theme.Spacing.block) {
            VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
                Text(title).font(Theme.Fonts.bodyStrong).foregroundStyle(Theme.Colors.text)
                Text(caption).font(Theme.Fonts.caption).foregroundStyle(Theme.Colors.textSubtle)
            }
            Spacer(minLength: 0)
            trailing
        }
        .padding(.vertical, Theme.Spacing.row)
        .frame(minHeight: Theme.controlHeight)
        .contentShape(Rectangle())
        .rowDivider()
    }
}

#Preview {
    NavigationStack { SettingsScreen() }
        .modelContainer(AppContainer.make(.inMemory).container)
}
