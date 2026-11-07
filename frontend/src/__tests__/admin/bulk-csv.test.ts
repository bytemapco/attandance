import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/components/admin/bulk/csv";

describe("parseCsv", () => {
  it("reads rows and cells", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("keeps a comma inside a quoted cell", () => {
    expect(parseCsv('name,note\nCivil,"Rao, Dr. A"')).toEqual([["name", "note"], ["Civil", "Rao, Dr. A"]]);
  });

  it("reads a doubled quote inside a quoted cell as one quote", () => {
    expect(parseCsv('a\n"say ""hi"""')).toEqual([["a"], ['say "hi"']]);
  });

  it("keeps a line break inside a quoted cell", () => {
    expect(parseCsv('a,b\n"line one\nline two",x')).toEqual([["a", "b"], ["line one\nline two", "x"]]);
  });

  it("handles Windows and old Mac line endings", () => {
    expect(parseCsv("a,b\r\n1,2\r\n3,4")).toEqual([["a", "b"], ["1", "2"], ["3", "4"]]);
    expect(parseCsv("a,b\r1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("drops the byte order mark Excel puts at the start of a UTF-8 file", () => {
    expect(parseCsv("﻿email,name\na@b.in,Asha")[0]).toEqual(["email", "name"]);
  });

  it("drops blank rows and rows of only spaces and commas", () => {
    expect(parseCsv("a,b\n\n  ,  \n1,2\n\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps empty cells so later columns stay in place", () => {
    expect(parseCsv("a,b,c\n1,,3")[1]).toEqual(["1", "", "3"]);
  });

  it("reads a last row that has no line break", () => {
    expect(parseCsv("a\n1")).toEqual([["a"], ["1"]]);
  });

  it("treats a quote in the middle of a cell as text", () => {
    expect(parseCsv('size\n5" pipe')).toEqual([["size"], ['5" pipe']]);
  });

  it("allows spaces around a quoted cell", () => {
    expect(parseCsv('h\n "a@b.in" , "EMP01" ')[1].map((cell) => cell.trim())).toEqual(["a@b.in", "EMP01"]);
  });

  it("returns nothing for empty text", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("toCsv", () => {
  it("quotes only the cells that need it", () => {
    expect(toCsv([["a", "b,c", 'd"e', "f\ng", " h"]])).toBe('a,"b,c","d""e","f\ng"," h"');
  });

  it("writes rows with Windows line endings", () => {
    expect(toCsv([["a"], ["b"]])).toBe("a\r\nb");
  });

  it("can be read back unchanged", () => {
    const rows = [["name", "note"], ["Rao, A", 'He said "yes"'], ["multi\nline", ""]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
