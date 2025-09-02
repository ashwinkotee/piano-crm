// web/src/components/__tests__/Protected.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Protected } from "../Protected";
import { useAuth } from "../../store/auth";

jest.mock("../../store/auth", () => ({
  useAuth: jest.fn(),
}));
const mockedUseAuth = useAuth as jest.Mock;

function renderWithRouter(ui: React.ReactNode, path = "/") {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}

describe("Protected", () => {
  it("redirects if no user", () => {
    mockedUseAuth.mockReturnValue({ user: null, token: null });
    renderWithRouter(<Protected role="admin"><div>Secret</div></Protected>);
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("blocks wrong role", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "portal" }, token: "t" });
    renderWithRouter(<Protected role="admin"><div>Secret</div></Protected>);
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders for correct role", () => {
    mockedUseAuth.mockReturnValue({ user: { role: "admin" }, token: "t" });
    renderWithRouter(<Protected role="admin"><div>Secret</div></Protected>);
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
