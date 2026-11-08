window.__ModuleLoader__.load({
  id: "dsh-plugin-search",
  factory: (require) => {
    const jsxRuntime = require("react/jsx-runtime");
    const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
    const jsx = jsxRuntime.jsx;
    const jsxs = jsxRuntime.jsxs;

    const name = "dsh-plugin-search";
    const inject = ["slots", "locale", "configForms"];
    const NS = "dsh-plugin-search";
    const SETTINGS_ENTRY_ID = "dsh-plugin-search";
    const PLUGIN_SEARCH = "simple-search";
    const DEEPSEEK_SEARCH = "deepseek-search-api";
    const LOCAL_FETCH = "http";
    const DEEPSEEK_FETCH = "deepseek-fetch-api";

    const en = {
      title: "Web search & fetch",
      description: "On: this plugin. Off: DeepSeek. Search and fetch are independent.",
      "search.label": "Search",
      "search.plugin": "Plugin (web_search_options)",
      "search.deepseek": "DeepSeek Search API",
      "search.hint.plugin": "Blocks DeepSeek search. Adds OpenAI web_search_options.",
      "search.hint.deepseek": "Uses DeepSeek Search API.",
      "fetch.label": "Fetch",
      "fetch.plugin": "Plugin (local HTTP)",
      "fetch.deepseek": "DeepSeek Fetch API",
      "fetch.hint.plugin": "Blocks DeepSeek fetch. The host fetches the URL, same as Claude Code WebFetch.",
      "fetch.hint.deepseek": "Uses DeepSeek Fetch API.",
      unavailable: "This plugin is not loaded, so it cannot be configured right now.",
      readOnly: "This deployment stores settings read-only.",
      saveFailed: "The deployment did not accept these values; they were left for you to correct.",
      save: "Save",
      saving: "Saving…",
    };
    const zh = {
      title: "网页搜索与抓取",
      description: "开 = 插件，关 = DeepSeek。搜索和抓取各自独立。",
      "search.label": "搜索",
      "search.plugin": "插件（web_search_options）",
      "search.deepseek": "DeepSeek Search API",
      "search.hint.plugin": "屏蔽 DeepSeek 搜索。请求带 OpenAI web_search_options。",
      "search.hint.deepseek": "使用 DeepSeek Search API。",
      "fetch.label": "抓取",
      "fetch.plugin": "插件（本机 HTTP）",
      "fetch.deepseek": "DeepSeek Fetch API",
      "fetch.hint.plugin": "屏蔽 DeepSeek 抓取。和 Claude Code 的 WebFetch 一样，由本机直接拉页面。",
      "fetch.hint.deepseek": "使用 DeepSeek Fetch API。",
      unavailable: "该插件当前未加载，暂时无法配置。",
      readOnly: "本部署的设置为只读。",
      saveFailed: "本部署没有接受这些值，已保留供你修改。",
      save: "保存",
      saving: "保存中…",
    };

    const STYLE = `
.dsh-plugin-search-section {
  display: grid;
  gap: 6px;
  padding: 12px 0;
}
.dsh-plugin-search-toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dsh-plugin-search-toggle-label {
  flex: 1;
  min-width: 0;
}
.dsh-plugin-search-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-plugin-search-divider {
  border-top: 1px solid var(--dsw-alias-border-l2);
}
`;

    function formLabels(t) {
      return {
        unavailable: t("unavailable"),
        readOnly: t("readOnly"),
        saveFailed: t("saveFailed"),
        save: t("save"),
        saving: t("saving"),
      };
    }

    function searchField() {
      return {
        field: "searchBackend",
        format: (value) => (value === "deepseek" ? "deepseek" : "plugin"),
        parse: (text) => ({ kind: "set", value: text === "deepseek" ? "deepseek" : "plugin" }),
      };
    }

    function fetchField() {
      return {
        field: "fetchBackend",
        format: (value) => (value === "deepseek" ? "deepseek" : "plugin"),
        parse: (text) => ({ kind: "set", value: text === "deepseek" ? "deepseek" : "plugin" }),
      };
    }

    function settingsForm(pluginScope, webScope) {
      const plugin = new primitives.SettingsFormModel(pluginScope, [
        searchField(),
        fetchField(),
      ]);
      const web =
        webScope === undefined
          ? undefined
          : new primitives.SettingsFormModel(webScope, [
              primitives.settingsTextField("searchProvider"),
              primitives.settingsTextField("fetchProvider"),
            ]);
      const isPlugin = (text) => text !== "deepseek";
      const searchProviderOf = (pluginOn) => (pluginOn ? PLUGIN_SEARCH : DEEPSEEK_SEARCH);
      const fetchProviderOf = (pluginOn) => (pluginOn ? LOCAL_FETCH : DEEPSEEK_FETCH);
      if (web !== undefined) {
        const searchOn = isPlugin(plugin.field("searchBackend").text);
        const fetchOn = isPlugin(plugin.field("fetchBackend").text);
        if (web.field("searchProvider").text !== searchProviderOf(searchOn)) {
          web.actions().edit("searchProvider", searchProviderOf(searchOn));
        }
        if (web.field("fetchProvider").text !== fetchProviderOf(fetchOn)) {
          web.actions().edit("fetchProvider", fetchProviderOf(fetchOn));
        }
      }
      const store = plugin.bind(() => {
        const searchPlugin = isPlugin(plugin.field("searchBackend").text);
        const fetchPlugin = isPlugin(plugin.field("fetchBackend").text);
        const webShell = web?.shell();
        const pluginShell = plugin.shell();
        return {
          ...pluginShell,
          dirty: pluginShell.dirty || Boolean(webShell?.dirty),
          invalid: pluginShell.invalid || Boolean(webShell?.invalid),
          saving: pluginShell.saving || Boolean(webShell?.saving),
          failed: pluginShell.failed || Boolean(webShell?.failed),
          writable: pluginShell.writable && (webShell === undefined || webShell.writable),
          searchPlugin,
          fetchPlugin,
        };
      });
      const pluginActions = plugin.actions();
      const actions = {
        ...pluginActions,
        edit(field, text) {
          pluginActions.edit(field, text);
          if (web === undefined) return;
          const webActions = web.actions();
          if (field === "searchBackend") {
            webActions.edit("searchProvider", searchProviderOf(isPlugin(text)));
          }
          if (field === "fetchBackend") {
            webActions.edit("fetchProvider", fetchProviderOf(isPlugin(text)));
          }
        },
        async save() {
          await pluginActions.save();
          if (plugin.shell().failed) return;
          if (web !== undefined && web.shell().dirty) await web.save();
        },
        discard() {
          pluginActions.discard();
          web?.actions().discard();
        },
      };
      return { plugin, web, store, actions };
    }

    function SettingsCard(props) {
      const { t, useSettingsCard } = props;
      const state = useSettingsCard((snapshot) => snapshot);
      if (props.view === "summary") return null;
      const disabled = !state.writable || state.saving;
      return jsxs(primitives.SettingsForm, {
        labels: formLabels(t),
        state,
        onSave: props.save,
        onDiscard: props.discard,
        children: [
          jsxs("div", {
            className: "dsh-plugin-search-section",
            children: [
              jsxs("div", {
                className: "dsh-plugin-search-toggle-row",
                children: [
                  jsx("span", { className: "dsh-plugin-search-toggle-label", children: t("search.label") }),
                  jsx(primitives.Switch, {
                    checked: state.searchPlugin,
                    label: t("search.label"),
                    disabled,
                    onChange: (next) => {
                      props.edit("searchBackend", next ? "plugin" : "deepseek");
                    },
                  }),
                ],
              }),
              jsx("p", {
                className: "dsh-plugin-search-hint",
                children: t(state.searchPlugin ? "search.hint.plugin" : "search.hint.deepseek"),
              }),
            ],
          }),
          jsx("div", { className: "dsh-plugin-search-divider" }),
          jsxs("div", {
            className: "dsh-plugin-search-section",
            children: [
              jsxs("div", {
                className: "dsh-plugin-search-toggle-row",
                children: [
                  jsx("span", { className: "dsh-plugin-search-toggle-label", children: t("fetch.label") }),
                  jsx(primitives.Switch, {
                    checked: state.fetchPlugin,
                    label: t("fetch.label"),
                    disabled,
                    onChange: (next) => {
                      props.edit("fetchBackend", next ? "plugin" : "deepseek");
                    },
                  }),
                ],
              }),
              jsx("p", {
                className: "dsh-plugin-search-hint",
                children: t(state.fetchPlugin ? "fetch.hint.plugin" : "fetch.hint.deepseek"),
              }),
            ],
          }),
        ],
      });
    }

    function apply(ctx) {
      ctx.effect(function* () {
        yield ctx.locale.register(NS, { en, zh });
        const style = document.createElement("style");
        style.dataset.plugin = SETTINGS_ENTRY_ID;
        style.textContent = STYLE;
        document.head.appendChild(style);
        yield () => style.remove();
        let webScope;
        try {
          webScope = ctx.configForms.get("web");
        } catch {
          webScope = undefined;
        }
        const { plugin, web, store, actions } = settingsForm(
          ctx.configForms.get(SETTINGS_ENTRY_ID),
          webScope,
        );
        ctx.effect(() => () => {
          plugin.dispose();
          web?.dispose();
        }, "dsh-plugin-search settings form");
        yield ctx.slots.inject("plugins.bundle.config", () =>
          ctx.slots.register(
            {
              name: "plugins.bundle.config",
              key: SETTINGS_ENTRY_ID,
              locale: NS,
              inject: () => ({ hooks: { settingsCard: store }, ...actions }),
            },
            SettingsCard,
          ),
        );
      });
    }

    return { apply, inject, name };
  },
});
