"use client";

import { useEffect } from "react";
import {
  applySettingsToDocument,
  loadSettingsFromStorage,
} from "./settings/settingsClient";
import {
  applyUiPrefsToDocument,
  loadUiPrefs,
} from "./settings/uiPrefs";

export default function SettingsBootstrap() {
  useEffect(() => {
    const settings = loadSettingsFromStorage();
    const uiPrefs = loadUiPrefs();

    applySettingsToDocument(settings);
    applyUiPrefsToDocument(uiPrefs);
  }, []);

  return null;
}