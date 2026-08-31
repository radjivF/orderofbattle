import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import { SelectSlots } from "./SelectSlots";

const options = [
  { value: "a", label: "Ardboyz" },
  { value: "b", label: "Brutes" },
  { value: "c", label: "Gore-gruntas" },
];

describe("SelectSlots", () => {
  afterEach(() => {
    cleanup();
  });

  it("picks from a searchable dropdown without a native listbox", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectSlots
        label="On unit"
        options={options}
        value={[]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /on unit/i }));
    await user.click(screen.getByRole("option", { name: "Ardboyz" }));
    expect(onChange).toHaveBeenCalledWith(["a"]);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("keeps the menu open so a second unit can be tagged", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <SelectSlots
        label="On unit"
        options={options}
        value={[]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /on unit/i }));
    await user.click(screen.getByRole("option", { name: "Ardboyz" }));

    rerender(
      <SelectSlots
        label="On unit"
        options={options}
        value={["a"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /on unit/i }));
    await user.click(screen.getByRole("option", { name: "Brutes" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("removes a tag from the field", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectSlots
        label="On unit"
        options={options}
        value={["a", "b"]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove Brutes" }));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("filters a long option list as the user types", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectSlots
        label="On unit"
        options={options}
        value={[]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /on unit/i }));
    await user.type(screen.getByRole("combobox", { name: /on unit/i }), "brut");
    expect(screen.getByRole("option", { name: "Brutes" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Ardboyz" }),
    ).not.toBeInTheDocument();
  });
});
