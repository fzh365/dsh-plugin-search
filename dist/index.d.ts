import { type ConfigShape } from "./pins.js";
export { PROVIDER_ID, isModelSearch, providerPins, resolveTavilyApiKey, searchModeOf, toolSearchReady, } from "./pins.js";
export type { ConfigShape, SearchMode } from "./pins.js";
export { composeSearchPrompt } from "./prompt.js";
export { pluginSearch } from "./search.js";
export declare const name = "dsh-plugin-search";
export declare const inject: string[];
export declare const Config: unknown;
interface WebSearchRequest {
    query: string;
    maxResults?: number;
}
interface WebRuntime {
    registerSearchProvider(provider: {
        id: string;
        available(): boolean;
        ready?(): boolean | Promise<boolean>;
        search(request: WebSearchRequest, signal?: AbortSignal): Promise<unknown>;
    }): unknown;
}
interface SettingsChild {
    settings?: {
        configure(policy: {
            auto: boolean;
        }, fiber?: unknown): unknown;
    };
    effect(fn: () => unknown, label?: string): unknown;
}
interface SystemPromptRuntime {
    section?(spec: {
        name: string;
        order?: number;
        text: string;
    }): unknown;
}
interface SystemPromptChild {
    systemPrompt?: SystemPromptRuntime;
    effect?(fn: () => unknown, label?: string): unknown;
}
interface DshContext {
    web: WebRuntime;
    inject?(deps: string[], callback: (child: SettingsChild & SystemPromptChild) => void): unknown;
    effect?(fn: () => unknown, label?: string): unknown;
    fiber?: unknown;
}
export declare function apply(ctx: DshContext, config?: ConfigShape): void;
