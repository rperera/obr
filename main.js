var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BratPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/github.ts
var import_obsidian = require("obsidian");
var API_ROOT = "https://api.github.com";
var API_VERSION = "2022-11-28";
function parseRepo(repoUrl) {
  const input = repoUrl.trim().replace(/\/+$/, "").replace(/\.git$/, "");
  const patterns = [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)$/,
    /^(?:ssh:\/\/)?git@github\.com[:/]([\w.-]+)\/([\w.-]+)$/,
    /^([\w.-]+)\/([\w.-]+)$/
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(input);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }
  return null;
}
async function apiGet(url, token, accept) {
  const headers = {
    Accept: accept,
    "X-GitHub-Api-Version": API_VERSION
  };
  if (token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }
  return (0, import_obsidian.requestUrl)({ url, headers, throw: false });
}
function requireOk(response, context) {
  if (response.status >= 200 && response.status < 300) {
    return;
  }
  if (response.status === 401) {
    throw new Error(`${context}: GitHub rejected the token (401)`);
  }
  if (response.status === 403) {
    throw new Error(
      `${context}: access forbidden or rate-limited (403) \u2014 check the token's repository access and permissions`
    );
  }
  if (response.status === 404) {
    throw new Error(
      `${context}: not found (404) \u2014 the repository or release does not exist, or the token cannot see it`
    );
  }
  throw new Error(`${context}: GitHub returned HTTP ${response.status}`);
}
function toRelease(json) {
  var _a;
  const release = json;
  if (typeof release.tag_name !== "string") {
    throw new Error("unexpected GitHub release payload (no tag_name)");
  }
  const assets = [];
  for (const asset of (_a = release.assets) != null ? _a : []) {
    if (typeof asset.name === "string" && typeof asset.url === "string") {
      assets.push({ name: asset.name, url: asset.url });
    }
  }
  return { tagName: release.tag_name, assets };
}
async function fetchLatestRelease(ref, token) {
  const context = `${ref.owner}/${ref.repo}`;
  const response = await apiGet(
    `${API_ROOT}/repos/${ref.owner}/${ref.repo}/releases/latest`,
    token,
    "application/vnd.github+json"
  );
  if (response.status === 404) {
    throw new Error(
      `${context}: no published release found (404) \u2014 publish a release, or check that the token can see the repository`
    );
  }
  requireOk(response, context);
  return toRelease(response.json);
}
async function fetchReleaseByTag(ref, tag, token) {
  const context = `${ref.owner}/${ref.repo}@${tag}`;
  const response = await apiGet(
    `${API_ROOT}/repos/${ref.owner}/${ref.repo}/releases/tags/${encodeURIComponent(tag)}`,
    token,
    "application/vnd.github+json"
  );
  requireOk(response, context);
  return toRelease(response.json);
}
async function downloadAsset(asset, token) {
  const response = await apiGet(
    asset.url,
    token,
    "application/octet-stream"
  );
  requireOk(response, `asset ${asset.name}`);
  return response.arrayBuffer;
}

// src/settings-tab.ts
var import_obsidian2 = require("obsidian");

// src/types.ts
var SELF_REPO_URL = "https://github.com/rperera/obr";
var DEFAULT_SETTINGS = {
  managed: [],
  checkOnStartup: true
};
function emptyManagedPlugin() {
  return {
    repoUrl: "",
    token: "",
    pinnedTag: "",
    installedTag: "",
    installedPluginId: ""
  };
}

// src/settings-tab.ts
var BratSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("Check for updates at startup").setDesc("Report available updates in a notice when Obsidian starts.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.checkOnStartup).onChange(async (value) => {
        this.plugin.settings.checkOnStartup = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Managed plugins").setHeading();
    this.plugin.settings.managed.forEach((managed, index) => {
      this.displayManagedPlugin(containerEl, managed, index);
    });
    new import_obsidian2.Setting(containerEl).addButton(
      (button) => button.setButtonText("Add managed plugin").setCta().onClick(async () => {
        this.plugin.settings.managed.push(emptyManagedPlugin());
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
  displayManagedPlugin(containerEl, managed, index) {
    const isSelf = managed.installedPluginId === this.plugin.manifest.id;
    const title = isSelf ? `${index + 1}. ${managed.installedPluginId} (this plugin)` : managed.installedPluginId ? `${index + 1}. ${managed.installedPluginId}` : `${index + 1}. New plugin`;
    const status = isSelf ? `Updates itself from ${managed.repoUrl}. Installed: ${managed.installedTag}` : managed.installedTag ? `Installed: ${managed.installedPluginId} ${managed.installedTag}` : "Not installed yet.";
    const heading = new import_obsidian2.Setting(containerEl).setName(title).setDesc(status).addButton(
      (button) => button.setButtonText("Check").setTooltip("Check this repository for an update").onClick(() => void this.plugin.checkOne(managed))
    ).addButton(
      (button) => button.setButtonText("Update").setTooltip("Install the target release now").onClick(async () => {
        await this.plugin.updateOne(managed);
        this.display();
      })
    );
    if (!isSelf) {
      heading.addButton(
        (button) => button.setButtonText("Remove").setWarning().setTooltip(
          "Stop managing this repository (installed plugin files are kept)"
        ).onClick(async () => {
          this.plugin.settings.managed.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        })
      );
    }
    if (!isSelf) {
      new import_obsidian2.Setting(containerEl).setName("Repository").setDesc('GitHub URL or "owner/repo".').addText(
        (text) => text.setPlaceholder("https://github.com/owner/repo").setValue(managed.repoUrl).onChange(async (value) => {
          managed.repoUrl = value;
          await this.plugin.saveSettings();
        })
      );
      new import_obsidian2.Setting(containerEl).setName("Access token").setDesc(
        "Fine-grained personal access token with read-only Contents permission on this repository. Stored in plain text in this vault's plugin settings. Leave empty for a public repository."
      ).addText(
        (text) => text.setPlaceholder("github_pat_\u2026").setValue(managed.token).onChange(async (value) => {
          managed.token = value;
          await this.plugin.saveSettings();
        })
      );
    }
    new import_obsidian2.Setting(containerEl).setName("Pinned tag").setDesc(
      "Install exactly this release tag instead of the latest release; leave empty to follow the newest release."
    ).addText(
      (text) => text.setPlaceholder("latest").setValue(managed.pinnedTag).onChange(async (value) => {
        managed.pinnedTag = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/updater.ts
var import_obsidian3 = require("obsidian");

// src/versions.ts
function parseVersion(tag) {
  const match = /^v?(\d+(?:\.\d+)*)$/.exec(tag.trim());
  if (!match) {
    return null;
  }
  return match[1].split(".").map((part) => Number(part));
}
function compareVersions(a, b) {
  var _a, _b;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const diff = ((_a = a[i]) != null ? _a : 0) - ((_b = b[i]) != null ? _b : 0);
    if (diff !== 0) {
      return diff < 0 ? -1 : 1;
    }
  }
  return 0;
}
function isNewer(candidate, installed) {
  const c = parseVersion(candidate);
  const i = parseVersion(installed);
  if (!c || !i) {
    return candidate !== installed;
  }
  return compareVersions(c, i) > 0;
}

// src/updater.ts
function pluginRegistry(app) {
  return app.plugins;
}
async function resolveRelease(managed) {
  if (!managed.repoUrl.trim()) {
    throw new Error("repository URL is not set");
  }
  const ref = parseRepo(managed.repoUrl);
  if (!ref) {
    throw new Error(
      `not a recognizable GitHub repository: "${managed.repoUrl}"`
    );
  }
  const pinned = managed.pinnedTag.trim();
  return pinned ? fetchReleaseByTag(ref, pinned, managed.token) : fetchLatestRelease(ref, managed.token);
}
function releaseIsUpdate(managed, release) {
  if (managed.pinnedTag.trim()) {
    return release.tagName !== managed.installedTag;
  }
  return !managed.installedTag || isNewer(release.tagName, managed.installedTag);
}
async function checkForUpdate(managed) {
  const release = await resolveRelease(managed);
  return {
    targetTag: release.tagName,
    hasUpdate: releaseIsUpdate(managed, release)
  };
}
function requireAsset(release, name) {
  const asset = release.assets.find((candidate) => candidate.name === name);
  if (!asset) {
    throw new Error(
      `release ${release.tagName} has no ${name} asset \u2014 attach the build artifacts (manifest.json, main.js, styles.css) to the release`
    );
  }
  return asset;
}
async function installFromRepo(app, managed) {
  var _a;
  const release = await resolveRelease(managed);
  if (!releaseIsUpdate(managed, release)) {
    return null;
  }
  const manifestAsset = requireAsset(release, "manifest.json");
  const mainAsset = requireAsset(release, "main.js");
  const stylesAsset = (_a = release.assets.find((asset) => asset.name === "styles.css")) != null ? _a : null;
  const manifestBytes = await downloadAsset(manifestAsset, managed.token);
  const manifestRaw = new TextDecoder("utf-8").decode(manifestBytes);
  const manifest = JSON.parse(manifestRaw);
  if (typeof manifest.id !== "string" || !manifest.id) {
    throw new Error(
      `release ${release.tagName}: manifest.json has no plugin id`
    );
  }
  const [mainBytes, stylesBytes] = await Promise.all([
    downloadAsset(mainAsset, managed.token),
    stylesAsset ? downloadAsset(stylesAsset, managed.token) : null
  ]);
  const pluginDir = (0, import_obsidian3.normalizePath)(
    `${app.vault.configDir}/plugins/${manifest.id}`
  );
  const adapter = app.vault.adapter;
  if (!await adapter.exists(pluginDir)) {
    await adapter.mkdir(pluginDir);
  }
  await adapter.writeBinary(`${pluginDir}/manifest.json`, manifestBytes);
  await adapter.writeBinary(`${pluginDir}/main.js`, mainBytes);
  if (stylesBytes !== null) {
    await adapter.writeBinary(`${pluginDir}/styles.css`, stylesBytes);
  }
  return { pluginId: manifest.id, tag: release.tagName };
}
async function reloadInstalledPlugin(app, pluginId) {
  const registry = pluginRegistry(app);
  const wasEnabled = registry.enabledPlugins.has(pluginId);
  if (wasEnabled) {
    await registry.disablePlugin(pluginId);
  }
  await registry.loadManifests();
  if (wasEnabled) {
    await registry.enablePlugin(pluginId);
  } else {
    await registry.enablePluginAndSave(pluginId);
  }
}

// src/main.ts
var SELF_REPO = parseRepo(SELF_REPO_URL);
function isSelfRepo(repoUrl) {
  const ref = parseRepo(repoUrl);
  return ref !== null && ref.owner.toLowerCase() === SELF_REPO.owner.toLowerCase() && ref.repo.toLowerCase() === SELF_REPO.repo.toLowerCase();
}
var BratPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.busy = false;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new BratSettingTab(this.app, this));
    this.addCommand({
      id: "check-for-updates",
      name: "Check for updates",
      callback: () => void this.checkAll(true)
    });
    this.addCommand({
      id: "update-all",
      name: "Update all managed plugins",
      callback: () => void this.updateAll()
    });
    this.app.workspace.onLayoutReady(() => {
      if (this.settings.checkOnStartup) {
        void this.checkAll(false);
      }
    });
  }
  async loadSettings() {
    const stored = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...stored };
    this.settings.managed = this.settings.managed.map((entry) => ({
      ...emptyManagedPlugin(),
      ...entry
    }));
    if (this.ensureSelfEntry()) {
      await this.saveSettings();
    }
  }
  /**
   * Brat updates itself from its public release channel (SELF_REPO_URL);
   * the entry for it is built in, not user configuration. Ensure it exists
   * on every load: repoint an existing self entry that tracks another
   * repository (e.g. the private source repo, from before releases moved),
   * or seed a fresh one. The running version counts as installed so a
   * fresh entry does not reinstall the release that is already running.
   */
  ensureSelfEntry() {
    var _a;
    const self = (_a = this.settings.managed.find(
      (entry) => entry.installedPluginId === this.manifest.id
    )) != null ? _a : this.settings.managed.find((entry) => isSelfRepo(entry.repoUrl));
    if (!self) {
      this.settings.managed.unshift({
        ...emptyManagedPlugin(),
        repoUrl: SELF_REPO_URL,
        installedTag: this.manifest.version,
        installedPluginId: this.manifest.id
      });
      return true;
    }
    if (isSelfRepo(self.repoUrl) && !self.token && self.installedPluginId === this.manifest.id) {
      return false;
    }
    self.repoUrl = SELF_REPO_URL;
    self.token = "";
    self.installedPluginId = this.manifest.id;
    if (!self.installedTag) {
      self.installedTag = this.manifest.version;
    }
    return true;
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  configuredPlugins() {
    return this.settings.managed.filter((entry) => entry.repoUrl.trim());
  }
  /** Check every managed repository and report what has updates. */
  async checkAll(verbose) {
    if (!this.claimBusy()) {
      return;
    }
    try {
      const updatable = [];
      for (const managed of this.configuredPlugins()) {
        try {
          const check = await checkForUpdate(managed);
          if (check.hasUpdate) {
            updatable.push(
              `${this.describe(managed)} \u2192 ${check.targetTag}`
            );
          }
        } catch (error) {
          this.reportError("check", managed, error);
        }
      }
      if (updatable.length > 0) {
        new import_obsidian4.Notice(
          `Brat: updates available
${updatable.join("\n")}
Update from the Brat settings tab or the "Update all managed plugins" command.`,
          1e4
        );
      } else if (verbose) {
        new import_obsidian4.Notice("Brat: all managed plugins are up to date");
      }
    } finally {
      this.busy = false;
    }
  }
  /** Update every managed repository; a self-update reloads Brat last. */
  async updateAll() {
    if (!this.claimBusy()) {
      return;
    }
    let selfUpdated = false;
    try {
      let updated = 0;
      for (const managed of this.configuredPlugins()) {
        try {
          const outcome = await this.installOne(managed);
          if (outcome === "self-updated") {
            selfUpdated = true;
          }
          if (outcome !== "up-to-date") {
            updated++;
          }
        } catch (error) {
          this.reportError("update", managed, error);
        }
      }
      if (updated === 0) {
        new import_obsidian4.Notice("Brat: all managed plugins are up to date");
      }
    } finally {
      this.busy = false;
      if (selfUpdated) {
        this.reloadSelf();
      }
    }
  }
  /** Update a single entry (settings-tab button). */
  async updateOne(managed) {
    if (!this.claimBusy()) {
      return;
    }
    let selfUpdated = false;
    try {
      const outcome = await this.installOne(managed);
      if (outcome === "self-updated") {
        selfUpdated = true;
      } else if (outcome === "up-to-date") {
        new import_obsidian4.Notice(
          `Brat: ${this.describe(managed)} is already up to date`
        );
      }
    } catch (error) {
      this.reportError("update", managed, error);
    } finally {
      this.busy = false;
      if (selfUpdated) {
        this.reloadSelf();
      }
    }
  }
  /** Check a single entry (settings-tab button). */
  async checkOne(managed) {
    if (!this.claimBusy()) {
      return;
    }
    try {
      const check = await checkForUpdate(managed);
      new import_obsidian4.Notice(
        check.hasUpdate ? `Brat: ${this.describe(managed)} has an update: ${check.targetTag}` : `Brat: ${this.describe(managed)} is up to date`
      );
    } catch (error) {
      this.reportError("check", managed, error);
    } finally {
      this.busy = false;
    }
  }
  /**
   * Install the target release and record the result. Reloads the
   * installed plugin unless the files written were Brat's own — reloading
   * ourself here would unload the code that is still running, so the
   * caller does that once all other work has finished.
   */
  async installOne(managed) {
    const result = await installFromRepo(this.app, managed);
    if (!result) {
      return "up-to-date";
    }
    managed.installedTag = result.tag;
    managed.installedPluginId = result.pluginId;
    await this.saveSettings();
    if (result.pluginId === this.manifest.id) {
      return "self-updated";
    }
    await reloadInstalledPlugin(this.app, result.pluginId);
    new import_obsidian4.Notice(`Brat: installed ${result.pluginId} ${result.tag}`);
    return "updated";
  }
  reloadSelf() {
    new import_obsidian4.Notice("Brat: updating itself \u2014 reloading");
    const registry = pluginRegistry(this.app);
    const id = this.manifest.id;
    window.setTimeout(() => {
      void (async () => {
        await registry.disablePlugin(id);
        await registry.loadManifests();
        await registry.enablePlugin(id);
      })();
    }, 250);
  }
  claimBusy() {
    if (this.busy) {
      new import_obsidian4.Notice("Brat: an update is already running");
      return false;
    }
    this.busy = true;
    return true;
  }
  describe(managed) {
    return managed.installedPluginId || managed.repoUrl;
  }
  reportError(action, managed, error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Brat: ${action} failed for ${managed.repoUrl}`, error);
    new import_obsidian4.Notice(
      `Brat: ${action} failed for ${this.describe(managed)}: ${message}`,
      1e4
    );
  }
};
