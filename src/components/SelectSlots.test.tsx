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
  it("toggles a checkmark row without a dropdown", async () => {
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

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Ardboyz" }));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("lets the user check more than one row", async () => {
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

    await user.click(screen.getByRole("checkbox", { name: "Ardboyz" }));
    expect(onChange).toHaveBeenCalledWith(["a"]);

    rerender(
      <SelectSlots
        label="On unit"
        options={options}
        value={["a"]}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Ardboyz" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Brutes" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("unchecks a row", async () => {
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

    await user.click(screen.getByRole("checkbox", { name: "Brutes" }));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });
});
