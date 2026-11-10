import SwiftData
import SwiftUI
import UniformTypeIdentifiers

/// Settings (mockup 12): Categories, iCloud sync status, Import from web, version.
struct SettingsScreen: View {
    static func versionText(info: [String: Any]?) -> String {
        "Version \(info?["CFBundleShortVersionString"] as? String ?? "–")"
    }

    static func syncColor(_ status: SyncStatus) -> Color {
        status == .on ? Theme.Colors.success : Theme.Colors.textSubtle
    }

    /// Reads the picked file (security-scoped), imports it all-or-nothing, then runs maintenance
    /// so recurring copies and de-duplication catch up with the imported records.
    static func importWebExport(from url: URL, context: ModelContext, now: Date = .now) throws -> ImportSummary {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
        guard size <= WebImport.maxBytes else { throw WebImportError.tooLarge }
        let file = try WebImport.decode(try Data(contentsOf: url))
        let summary = try WebImporter(context: context).run(file)
        try AppMaintenance(context: context).run(now: now)
        return summary
    }

    @Environment(\.modelContext) private var context
    @Environment(\.storeMode) private var storeMode
    @Environment(\.scenePhase) private var scenePhase
    @State private var hasICloudAccount = FileManager.default.ubiquityIdentityToken != nil
    @AppStorage("lastImportSummary") private var lastImportSummary = ""
    @State private var isImporting = false
    @State private var errorMessage: String?

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
                    SettingsRow(title: "Categories", caption: "Add, review, and remove expense categories") { chevron }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("settings-categories")

                SectionRule("iCloud sync").padding(.top, Theme.Spacing.section)
                SettingsRow(title: "Sync across your devices",
                            caption: "Expenses and receipts are kept in your iCloud") { EmptyView() }
                StatusText(sync.title, color: Self.syncColor(sync))
                    .padding(.top, Theme.Spacing.tight)

                SectionRule("Bring data from the web app").padding(.top, Theme.Spacing.section)
                Button { isImporting = true } label: {
                    SettingsRow(title: "Import from web",
                                caption: "Choose the file exported from Settings on the web") { chevron }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("settings-import")
                if !lastImportSummary.isEmpty {
                    Text("Last import: \(lastImportSummary)")
                        .font(Theme.Fonts.caption)
                        .foregroundStyle(Theme.Colors.textSubtle)
                        .padding(.top, Theme.Spacing.row)
                }
            }
            .screenMargins()
            .padding(.vertical, Theme.Spacing.block)
        }
        .background(Theme.Colors.background)
        .toolbar(.hidden, for: .navigationBar)
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { hasICloudAccount = FileManager.default.ubiquityIdentityToken != nil }
        }
        .fileImporter(isPresented: $isImporting, allowedContentTypes: [.json]) { result in
            do {
                let summary = try Self.importWebExport(from: try result.get(), context: context)
                lastImportSummary = summary.text
            } catch {
                errorMessage = error.localizedDescription
            }
        }
        .errorAlert($errorMessage)
    }

    private var chevron: some View {
        Image(systemName: "chevron.right")
            .font(Theme.Fonts.small)
            .foregroundStyle(Theme.Colors.textSubtle)
            .accessibilityHidden(true)
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
