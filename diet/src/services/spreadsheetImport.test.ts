import assert from "node:assert/strict";
import test from "node:test";
import { parseDietCsv } from "./spreadsheetImport.ts";

const headers =
  ",김지민,,,,,,,,,,,,,,\n,9시 - 11시,분류,11시 - 3시,분류,,3시  - 6시,분류,6시  - 8시,분류,운동일지,체중,운동,근육량,체지방률,체지방량\n";

test("제공된 다이어트일지 형식을 앱 데이터로 변환한다", () => {
  const result = parseDietCsv(
    headers + '2026.08.12,"계란, 토스트",클린식,피자,자유식,,-,결식,닭가슴살,클린식,-,54.2,,,,\n',
    "2026-08-13",
  );
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.rows[0], {
    date: "2026-08-12",
    weight: 54.2,
    meals: [
      { meal: "breakfast", food: "계란, 토스트", type: "clean" },
      { meal: "lunch", food: "피자", type: "free" },
      { meal: "dinner", food: "닭가슴살", type: "clean" },
    ],
  });
});

test("미래 날짜와 불일치한 식사 분류를 오류로 표시한다", () => {
  const result = parseDietCsv(
    headers +
      "2026.08.14,-,결식,-,결식,,-,결식,-,결식,-,54,,,,\n2026.08.12,계란,결식,-,결식,,-,결식,-,결식,-,54,,,,\n",
    "2026-08-13",
  );
  assert.equal(result.rows.length, 0);
  assert.deepEqual(
    result.issues.map((issue) => issue.row),
    [3, 4],
  );
});
