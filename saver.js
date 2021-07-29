const STORAGE_KEY = "tab-saver";
const STORAGE_METHOD_CLIPBOARD = "clipboard";
const STORAGE_METHOD_LOCAL_STORAGE = "local-storage";
const ACTION_SAVE = "save";
const ACTION_LOAD = "load";
const ACTION_COUNT = "count";

const tabSaver = document.querySelector("#tab-saver");
const tabLoader = document.querySelector("#tab-loader");
const storageLocalStorage = document.querySelector("#storage-local-storage");
const storageClipboard = document.querySelector("#storage-clipboard");

let currentTabs = [];

async function saveToClipboard() {
  const tabData = currentTabs.join("\n");
  await navigator.clipboard.writeText(tabData);
}

async function loadFromClipboard() {
  const tabs = (await navigator.clipboard.readText()).split("\n");
  openTabs(tabs);
}

async function getTabCountFromClipboard() {
  const tabs = (await navigator.clipboard.readText()).split("\n");
  return tabs.length;
}

async function saveToLocalStorage() {
  browser.storage.local.set({ [STORAGE_KEY]: currentTabs });
}

async function loadFromLocalStorage() {
  const tabs = await browser.storage.local.get(STORAGE_KEY);
  openTabs(tabs[STORAGE_KEY]);
  // Clear storage
  browser.storage.local.remove(STORAGE_KEY);
}

async function getTabCountFromLocalStorage() {
  try {
    const tabs = await browser.storage.local.get(STORAGE_KEY);
    return tabs[STORAGE_KEY].length;
  } catch {
    return 0;
  }
}

function openTabs(tabs) {
  // TODO validate URL
  tabs.forEach((tab) => browser.tabs.create({ url: tab }));
}

function updateButtonWithCount(element, label, count) {
  if (count > 0) {
    element.disabled = false;
    element.textContent = label + " (" + count + ")";
  } else {
    element.disabled = true;
  }
}

const actions = {
  [STORAGE_METHOD_LOCAL_STORAGE]: {
    [ACTION_SAVE]: saveToLocalStorage,
    [ACTION_LOAD]: loadFromLocalStorage,
    [ACTION_COUNT]: getTabCountFromLocalStorage,
  },
  [STORAGE_METHOD_CLIPBOARD]: {
    [ACTION_SAVE]: saveToClipboard,
    [ACTION_LOAD]: loadFromClipboard,
    [ACTION_COUNT]: getTabCountFromClipboard,
  },
};

async function update() {
  try {
    // Get all tabs and populate the list
    currentTabs = await browser.tabs.query({ currentWindow: true });
    currentTabs = currentTabs.map(tab => tab.url);

    const storage = storageLocalStorage.checked
      ? STORAGE_METHOD_LOCAL_STORAGE
      : STORAGE_METHOD_CLIPBOARD;

    tabSaver.addEventListener("click", actions[storage][ACTION_SAVE]);
    tabLoader.addEventListener("click", actions[storage][ACTION_LOAD]);

    const storedTabCount = await actions[storage][ACTION_COUNT]();

    // Update buttons
    updateButtonWithCount(tabSaver, "Save", currentTabs.length);
    updateButtonWithCount(tabLoader, "Load", storedTabCount);
  } catch (e) {
    console.error(e);
  }
}

storageLocalStorage.addEventListener("change", update);
storageClipboard.addEventListener("change", update);
update();
