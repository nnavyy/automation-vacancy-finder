import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import TagInput from "@/components/ui/TagInput";
import { ROLES } from "@/lib/catalog/data";

function Harness({ initial = [] as string[], onChange }: { initial?: string[]; onChange?: (v: string[]) => void }) {
  const [v, setV] = useState<string[]>(initial);
  return (
    <TagInput
      label="Target Roles"
      value={v}
      catalog={ROLES}
      onChange={(n) => {
        setV(n);
        onChange?.(n);
      }}
    />
  );
}

describe("TagInput", () => {
  it("shows suggestions when typing 'fron'", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole("combobox"), "fron");
    expect(await screen.findByRole("option", { name: "Frontend Developer" })).toBeTruthy();
  });

  it("Enter picks the highlighted suggestion", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.type(screen.getByRole("combobox"), "fron{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["Frontend Developer"]);
  });

  it("ArrowDown moves selection before Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.type(screen.getByRole("combobox"), "fron{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["Frontend Engineer"]);
  });

  it("Enter adds custom text when nothing matches", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.type(screen.getByRole("combobox"), "Quantum Gardener{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["Quantum Gardener"]);
  });

  it("does not add duplicates (case-insensitive)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={["React"]} onChange={onChange} />);
    await user.type(screen.getByRole("combobox"), "react,");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Backspace on empty input removes last chip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={["A", "B"]} onChange={onChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith(["A"]);
  });

  it("remove button removes a chip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness initial={["A", "B"]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Remove A" }));
    expect(onChange).toHaveBeenLastCalledWith(["B"]);
  });

  it("pasting comma separated list adds multiple chips", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.paste("React, Next.js, TypeScript");
    expect(onChange).toHaveBeenLastCalledWith(["React", "Next.js", "TypeScript"]);
  });

  it("exposes combobox aria attributes", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
  });
});
