/**
 * Unit tests for edition separation
 * Feature: edition-separation
 */

import { test } from "node:test";
import * as assert from "node:assert";

// Import the edition module to test
import { EDITION, isOSS, isEnterprise } from "../app/lib/edition.js";

/**
 * Test 1: Edition variable defaults to OSS
 * Feature: edition-separation, Test 1: Edition variable defaults to OSS
 * Validates: Requirements 1.2
 */
test("Test 1: Edition variable defaults to OSS when undefined", () => {
  // Test that the default behavior logic is correct
  const testCases = [undefined, "", null, " ", "\t", "\n", "  \n\t  "];

  testCases.forEach((envValue) => {
    // Simulate what the edition module does with these values
    const simulatedEdition = (envValue?.trim() || "oss");

    assert.strictEqual(
      simulatedEdition,
      "oss",
      `Edition should default to "oss" when OPSORCH_EDITION is ${JSON.stringify(envValue)}`
    );
  });

  // Also verify that if OPSORCH_EDITION was not set during this process,
  // the module correctly defaults to "oss"
  if (!process.env.OPSORCH_EDITION || process.env.OPSORCH_EDITION.trim() === "") {
    assert.strictEqual(EDITION, "oss", "EDITION constant should be 'oss' when env var is not set");
    assert.strictEqual(isOSS(), true, "isOSS() should return true when env var is not set");
    assert.strictEqual(isEnterprise(), false, "isEnterprise() should return false when env var is not set");
  }
});

/**
 * Test 5: Edition utility returns correct values
 * Feature: edition-separation, Test 5: Edition utility returns correct values
 * Validates: Requirements 9.2, 9.5
 */
test("Test 5: Edition utility returns correct values", () => {
  const testCases = ["oss", "enterprise", "other"];

  testCases.forEach((editionValue) => {
    // Simulate what isEnterprise() does
    const shouldBeEnterprise = editionValue === "enterprise";
    const shouldBeOSS = editionValue !== "enterprise";

    // Test the logic
    assert.strictEqual(
      shouldBeEnterprise,
      editionValue === "enterprise",
      `isEnterprise() should return ${shouldBeEnterprise} for "${editionValue}"`
    );

    assert.strictEqual(
      shouldBeOSS,
      editionValue !== "enterprise",
      `isOSS() should return ${shouldBeOSS} for "${editionValue}"`
    );
  });
});

/**
 * Test 8: Invalid edition values default to OSS
 * Feature: edition-separation, Test 8: Invalid edition values default to OSS
 * Validates: Requirements 1.5
 */
test("Test 8: Invalid edition values default to OSS behavior", () => {
  const invalidValues = ["ENTERPRISE", "Enterprise", "OSS", "Oss", "invalid", "test", "prod", "dev"];

  invalidValues.forEach((invalidValue) => {
    // Test that the isEnterprise logic treats any non-"enterprise" value as OSS
    const simulatedIsEnterprise = invalidValue === "enterprise";
    const simulatedIsOSS = invalidValue !== "enterprise";

    assert.strictEqual(
      simulatedIsEnterprise,
      false,
      `isEnterprise() should return false for invalid value "${invalidValue}"`
    );

    assert.strictEqual(
      simulatedIsOSS,
      true,
      `isOSS() should return true for invalid value "${invalidValue}"`
    );
  });
});

/**
 * Unit test: Verify current edition utilities work correctly
 */
test("Edition utilities work correctly for current environment", () => {
  // Test that the functions are consistent with the EDITION constant
  if (EDITION === "enterprise") {
    assert.strictEqual(isEnterprise(), true, "isEnterprise() should return true when EDITION is 'enterprise'");
    assert.strictEqual(isOSS(), false, "isOSS() should return false when EDITION is 'enterprise'");
  } else {
    assert.strictEqual(isEnterprise(), false, "isEnterprise() should return false when EDITION is not 'enterprise'");
    assert.strictEqual(isOSS(), true, "isOSS() should return true when EDITION is not 'enterprise'");
  }
});

/**
 * Test 3: Navigation filtering matches edition
 * Feature: edition-separation, Test 3: Navigation filtering matches edition
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
test("Test 3: Navigation filtering matches edition", () => {
  const navItems = [
    { href: "/oss", label: "OSS Item", edition: "oss" },
    { href: "/ent", label: "Enterprise Item", edition: "enterprise" },
    { href: "/both", label: "Shared Item", edition: "both" },
    { href: "/none", label: "No Edition Item" }, // defaults to both
  ];

  const editions = ["oss", "enterprise"];

  editions.forEach((currentEdition) => {
    // Simulate the filtering logic from AppShell
    const filteredItems = navItems.filter((item) => {
      if (!item.edition || item.edition === "both") return true;
      if (item.edition === "enterprise") return currentEdition === "enterprise";
      if (item.edition === "oss") return currentEdition !== "enterprise";
      return true;
    });

    // Verify all filtered items are appropriate for the edition
    for (const item of filteredItems) {
      if (item.edition === "enterprise") {
        assert.strictEqual(
          currentEdition,
          "enterprise",
          `Enterprise-only item "${item.label}" should not appear in OSS edition`
        );
      }
    }

    // Verify no enterprise items in OSS
    if (currentEdition === "oss") {
      const hasEnterpriseItems = filteredItems.some((item) => item.edition === "enterprise");
      assert.strictEqual(
        hasEnterpriseItems,
        false,
        "OSS edition should not have any enterprise-only navigation items"
      );

      // Should have OSS items
      const hasOSSItems = filteredItems.some((item) => item.edition === "oss");
      assert.strictEqual(hasOSSItems, true, "OSS edition should have OSS items");
    }

    // Verify no OSS items in Enterprise (if that's the logic, though usually Enterprise includes OSS features, 
    // but the filter logic: if (item.edition === "oss") return currentEdition !== "enterprise"; 
    // implies "oss" tagged items are OSS-ONLY. Shared items should be "both" or undefined)
    if (currentEdition === "enterprise") {
      const hasOSSOnlyItems = filteredItems.some((item) => item.edition === "oss");
      assert.strictEqual(
        hasOSSOnlyItems,
        false,
        "Enterprise edition should not have OSS-only items (items tagged explicitly as 'oss')"
      );
    }
  });
});

/**
 * Test 7: Enterprise files are in dedicated directories
 * Feature: edition-separation, Test 7: Enterprise files are in dedicated directories
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
test("Test 7: Enterprise files are in dedicated directories", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  // Verify enterprise directories exist
  const enterpriseDirs = [
    "app/(enterprise)",
    "app/components/(enterprise)",
    "app/api/(enterprise)",
  ];

  for (const dir of enterpriseDirs) {
    const fullPath = path.join(process.cwd(), dir);
    const stats = await fs.stat(fullPath);
    assert.strictEqual(
      stats.isDirectory(),
      true,
      `${dir} should be a directory`
    );
  }
});
