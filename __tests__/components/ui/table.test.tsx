/**
 * @jest-environment jsdom
 *
 * Unit tests for components/ui/table.tsx
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { Table } from "@/components/ui/table";

type Row = { id: string; name: string };

const columns = [
  { key: "name", header: "Name", render: (row: Row) => row.name },
];

describe("Table", () => {
  it("renders column headers", () => {
    render(<Table columns={columns} rows={[{ id: "1", name: "Alice" }]} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders row data", () => {
    render(<Table columns={columns} rows={[{ id: "1", name: "Alice" }]} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders emptyState when rows is empty", () => {
    render(
      <Table
        columns={columns}
        rows={[]}
        emptyState={<div>No data</div>}
      />
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders null when rows is empty and no emptyState provided", () => {
    const { container } = render(<Table columns={columns} rows={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
