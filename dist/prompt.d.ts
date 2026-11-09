import type { SearchMode } from "./pins.js";
export declare const PROMPT_SECTION = "dsh-plugin-search";
export declare function currentMonthYear(now?: Date): string;
export declare function composeSearchPrompt(mode: SearchMode, now?: Date): string;
