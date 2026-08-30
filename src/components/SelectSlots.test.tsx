import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { SelectSlots } from "./SelectSlots";

const options = [
  { value: "a", label: "Ardboyz" },
  { value: "b", label: "Brutes" },
  { value: "c", label: "Gore-gruntas" },
];

describe("SelectSlots", () => {
  it("uses one combobox when max is 1", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectSlots
        label="On unit"
        options={options}
        value={[]}
        max={1}
        onChange={onChange}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /on unit/i }),
      "b",
    );
    expect(onChange).toHaveBeenCalledWith(["b"]);
  });

  it("adds a second native dropdown after the first pick", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SelectSlots
        label="On unit · up to 2"
        itemNoun="Unit"
        options={options}
        value={[]}
        max={2}
        onChange={onChange}
        hint="Pick up to 2 units."
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /add unit/i }),
      "a",
    );
    expect(onChange).toHaveBeenCalledWith(["a"]);

    rerender(
      <SelectSlots
        label="On unit · up to 2"
        itemNoun="Unit"
        options={options}
        value={["a"]}
        max={2}
        onChange={onChange}
        hint="Pick up to 2 units."
      />,
    );

    expect(screen.getByRole("combobox", { name: "Unit 1" })).toHaveValue("a");
    const add = screen.getByRole("combobox", { name: /add unit/i });
    expect(
      within(add).queryByRole("option", { name: "Ardboyz" }),
    ).not.toBeInTheDocument();
    await user.selectOptions(add, "b");
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("clears a slot without a native multiple listbox", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectSlots
        label="On unit · up to 2"
        itemNoun="Unit"
        options={options}
        value={["a", "b"]}
        max={2}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Unit 2" }),
      "",
    );
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });
});
