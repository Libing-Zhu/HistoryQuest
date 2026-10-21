import { it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityPage } from "../src/Community";

it("explains Pages limitations without calling a missing API and keeps personal notes accessible", async () => {
  vi.stubEnv("VITE_HOSTING", "github-pages");
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  try {
    render(<CommunityPage><p>个人收藏测试内容</p></CommunityPage>);
    expect(screen.getByText("共享社区暂未开放")).toBeVisible();
    expect(screen.queryByRole("button", { name: "发布分享" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "我的收藏与笔记" }));
    expect(screen.getByText("个人收藏测试内容")).toBeVisible();
    expect(request).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  }
});
