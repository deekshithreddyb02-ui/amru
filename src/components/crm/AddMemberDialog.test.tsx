import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddMemberDialog } from "@/components/crm/AddMemberDialog";

const invokeMock = vi.fn();
const insertMock = vi.fn();
const rpcMock = vi.fn().mockResolvedValue({ data: true, error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: () => ({ insert: (...args: unknown[]) => insertMock(...args) }),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const baseProps = {
  workspaceId: "ws-1",
  workspaceName: "Maharashtra",
  emails: { "existing-user-id": "existing@example.com" },
  crmRoles: ["crm_sales_rep", "crm_sales_mgr"] as const,
  roleLabels: { crm_sales_rep: "Sales Executive", crm_sales_mgr: "Sales Manager" },
  onAdded: vi.fn(),
};

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /add/i }));
  return within(await screen.findByRole("dialog"));
}

describe("AddMemberDialog", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    insertMock.mockReset().mockResolvedValue({ error: null });
    rpcMock.mockClear();
    baseProps.onAdded = vi.fn();
  });

  it("non-superadmin: hides creation checkbox usability and cannot toggle", async () => {
    const user = userEvent.setup();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={false} onAdded={vi.fn()} />);
    const dialog = await openDialog(user);
    const checkbox = dialog.getByRole("checkbox", { name: /create new employee/i });
    expect(checkbox).toBeDisabled();
    // No inline create fields should appear
    expect(dialog.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("non-superadmin add-only path succeeds for existing user", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={false} onAdded={onAdded} />);
    const dialog = await openDialog(user);
    await user.type(dialog.getByLabelText(/user email/i), "existing@example.com");
    await user.click(dialog.getByTestId("add-member-submit"));

    await waitFor(() => expect(insertMock).toHaveBeenCalledTimes(1));
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_id: "ws-1",
        user_id: "existing-user-id",
      }),
    );
    expect(invokeMock).not.toHaveBeenCalled();
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
  });

  it("non-superadmin shows error when user is not found", async () => {
    const user = userEvent.setup();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={false} />);
    const dialog = await openDialog(user);
    await user.type(dialog.getByLabelText(/user email/i), "unknown@example.com");
    await user.click(dialog.getByTestId("add-member-submit"));
    expect(await dialog.findByText(/no user found/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("superadmin: validates create-employee fields before invoking", async () => {
    const user = userEvent.setup();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={true} />);
    const dialog = await openDialog(user);
    await user.type(dialog.getByLabelText(/user email/i), "new@example.com");
    await user.click(dialog.getByRole("checkbox", { name: /create new employee/i }));

    // Clear auto-suggested fields and use bad values
    const username = dialog.getByLabelText(/username/i) as HTMLInputElement;
    await user.clear(username);
    await user.type(username, "AB!");
    const pwd = dialog.getByLabelText(/temp password/i) as HTMLInputElement;
    await user.type(pwd, "short");

    await user.click(dialog.getByTestId("add-member-submit"));

    expect(
      await dialog.findByText(/lowercase letters, digits/i),
    ).toBeInTheDocument();
    expect(dialog.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
    // Values retained for retry
    expect(username.value).toBe("AB!");
    expect(pwd.value).toBe("short");
  });

  it("superadmin: shows duplicate username error and keeps form values", async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, error: "Username already taken" },
      error: null,
    });
    const user = userEvent.setup();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={true} />);
    const dialog = await openDialog(user);

    await user.type(dialog.getByLabelText(/user email/i), "new@example.com");
    await user.click(dialog.getByRole("checkbox", { name: /create new employee/i }));

    const pwd = dialog.getByLabelText(/temp password/i) as HTMLInputElement;
    await user.type(pwd, "Welcome123");

    await user.click(dialog.getByTestId("add-member-submit"));

    expect(await dialog.findByText(/username already taken/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
    // Values retained
    expect((dialog.getByLabelText(/user email/i) as HTMLInputElement).value).toBe(
      "new@example.com",
    );
    expect(pwd.value).toBe("Welcome123");
  });

  it("superadmin: successful creation calls invoke, insert, audit rpc, and onAdded", async () => {
    invokeMock.mockResolvedValue({
      data: { success: true, user_id: "new-user-123" },
      error: null,
    });
    const user = userEvent.setup();
    const onAdded = vi.fn();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={true} onAdded={onAdded} />);
    const dialog = await openDialog(user);

    await user.type(dialog.getByLabelText(/user email/i), "new@example.com");
    await user.click(dialog.getByRole("checkbox", { name: /create new employee/i }));
    await user.type(dialog.getByLabelText(/temp password/i), "Welcome123");

    await user.click(dialog.getByTestId("add-member-submit"));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledWith(
      "create-employee",
      expect.objectContaining({
        body: expect.objectContaining({
          email: "new@example.com",
          workspace_id: "ws-1",
        }),
      }),
    );
    await waitFor(() => expect(insertMock).toHaveBeenCalled());
    await waitFor(() => expect(rpcMock).toHaveBeenCalledWith(
      "log_employee_created_audit",
      expect.objectContaining({ _workspace_id: "ws-1", _target_user_id: "new-user-123" }),
    ));
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
  });

  it("shows network error and keeps values when edge function throws", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Network down" } });
    const user = userEvent.setup();
    render(<AddMemberDialog {...baseProps} isSuperAdmin={true} />);
    const dialog = await openDialog(user);

    await user.type(dialog.getByLabelText(/user email/i), "new@example.com");
    await user.click(dialog.getByRole("checkbox", { name: /create new employee/i }));
    await user.type(dialog.getByLabelText(/temp password/i), "Welcome123");

    await user.click(dialog.getByTestId("add-member-submit"));

    expect(await dialog.findByText(/network down/i)).toBeInTheDocument();
    expect(insertMock).not.toHaveBeenCalled();
    expect(
      (dialog.getByLabelText(/user email/i) as HTMLInputElement).value,
    ).toBe("new@example.com");
  });
});
