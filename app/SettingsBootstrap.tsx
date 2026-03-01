"use client";

import { useEffect } from "react";
import { applySettingsToDocument, loadSettingsFromStorage } from "./settings/settingsClient";

export default function SettingsBootstrap() {
  useEffect(() => {
    const settings = loadSettingsFromStorage();
    applySettingsToDocument(settings);
  }, []);

  return null;
}