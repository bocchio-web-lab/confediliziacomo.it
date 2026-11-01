const STORAGE_KEY = "confedilizia:show-help";

/**
 * Whether the explanations of the form (the grey texts under the fields, the notes on how the
 * result is made) are all shown. When they are not, each field has a small info button that
 * opens its own explanation. The choice is remembered by the browser.
 */
export const helpState = $state({ showAll: false });

export function loadHelpPreference() {
    try {
        helpState.showAll = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        // Storage can be blocked (private windows): the default stays.
    }
}

export function setShowAllHelp(showAll: boolean) {
    helpState.showAll = showAll;
    try {
        localStorage.setItem(STORAGE_KEY, showAll ? "1" : "0");
    } catch {
        // Not remembered, but it works for this visit.
    }
}
