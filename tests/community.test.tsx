import { beforeEach, it, expect, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommunityPage } from "../src/Community";
import {
  localIdentity,
  readPosts,
  publishPost,
  emptyDraft,
  addReply,
  removePost,
  removeReply,
  readDraft,
  writeDraft,
  storageMessage,
} from "../src/communityStore";
import App from "../src/App";

const shared = vi.hoisted(() => ({ posts: [] as any[], publish: vi.fn() }));
vi.mock("../src/sharedCommunity", () => ({
  sharedSession: vi.fn(async () => ({ id: "test-shared-session" })),
  sharedPosts: vi.fn(async () => ({ posts: [...shared.posts], cursor: null })),
  publishShared: (...args: unknown[]) => shared.publish(...args),
  deleteShared: vi.fn(async (id: string) => {
    shared.posts = shared.posts.filter((p) => p.id !== id);
    return { deleted: true };
  }),
}));
beforeEach(async () => {
  shared.posts = [];
  shared.publish.mockReset().mockImplementation(async (draft: any) => {
    const post = {
      ...draft,
      id: "shared-1",
      at: Date.now(),
      mine: true,
      nickname: draft.nickname || "匿名游客",
    };
    shared.posts = [post, ...shared.posts];
    return post;
  });
  const request = indexedDB.open("historyquest-community-v1", 1);
  const db = await new Promise<IDBDatabase>((resolve) => {
    request.onupgradeneeded = () => {
      request.result.createObjectStore("posts", { keyPath: "id" });
      request.result.createObjectStore("settings");
    };
    request.onsuccess = () => resolve(request.result);
  });
  await new Promise<void>((resolve) => {
    const tx = db.transaction(["posts", "settings"], "readwrite");
    tx.objectStore("posts").clear();
    tx.objectStore("settings").clear();
    tx.oncomplete = () => resolve();
  });
  db.close();
});
it("stores real blobs and drafts, commits publication and enforces ownership", async () => {
  const owner = await localIdentity();
  expect(await localIdentity()).toBe(owner);
  const draft = {
    ...emptyDraft(),
    text: "金色雕饰令人印象深刻",
    media: [
      {
        id: "photo",
        name: "展品.jpg",
        kind: "image" as const,
        blob: new NodeBlob(["image bytes"], {
          type: "image/jpeg",
        }) as unknown as Blob,
      },
    ],
  };
  await writeDraft(draft);
  expect((await readDraft()).text).toBe(draft.text);
  const post = await publishPost(draft, owner);
  expect((await readDraft()).text).toBe("");
  expect((await readPosts())[0].media[0].blob.size).toBe(11);
  await addReply(post.id, "another-owner", "同学", "我更喜欢彩绣部分");
  let saved = (await readPosts())[0];
  expect(saved.replies).toHaveLength(1);
  await removeReply(post.id, saved.replies[0].id, owner);
  expect((await readPosts())[0].replies).toHaveLength(1);
  await removeReply(post.id, saved.replies[0].id, "another-owner");
  expect((await readPosts())[0].replies).toHaveLength(0);
  await removePost(post.id, "another-owner");
  expect(await readPosts()).toHaveLength(1);
  await removePost(post.id, owner);
  expect(await readPosts()).toHaveLength(0);
});
it("publishes into the shared feed without uploading historical local posts or replies", async () => {
  const owner = await localIdentity();
  const old = await publishPost(
    { ...emptyDraft(), text: "历史分享，需要保留" },
    owner,
  );
  await addReply(old.id, owner, "原游客", "历史回复，也要保留");
  const historical = (await readPosts())[0];
  let view = render(
    <CommunityPage>
      <p>原有收藏</p>
    </CommunityPage>,
  );
  await screen.findByRole("button", { name: "发布分享" });
  expect(screen.queryByText("参观后的讨论")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("筛选主题")).not.toBeInTheDocument();
  expect(screen.queryByText("从你的第一个发现开始")).not.toBeInTheDocument();
  expect(screen.queryByText("历史分享，需要保留")).not.toBeInTheDocument();
  await userEvent.type(screen.getByLabelText("昵称（选填）"), "小林");
  await userEvent.type(
    screen.getByLabelText("你的参观感受或问题"),
    "想继续了解礼轿的玻璃画。",
  );
  await userEvent.click(screen.getByRole("button", { name: "发布分享" }));
  await screen.findByText("分享已发布，其他游客可在游客分享中查看。");
  expect((await readPosts()).find((p) => p.id === old.id)).toEqual(historical);
  expect(await readPosts()).toHaveLength(1);
  view.unmount();
  view = render(
    <CommunityPage>
      <p>原有收藏</p>
    </CommunityPage>,
  );
  await screen.findByRole("button", { name: "发布分享" });
  expect(await readPosts()).toHaveLength(1);
  expect(await screen.findByRole("article")).toHaveTextContent(
    "想继续了解礼轿的玻璃画。",
  );
  await userEvent.click(screen.getByRole("tab", { name: "我的收藏与笔记" }));
  expect(screen.getByText("原有收藏")).toBeVisible();
});
it("keeps a failed publication draft and renders visitor input as text", async () => {
  render(
    <CommunityPage>
      <p>收藏</p>
    </CommunityPage>,
  );
  await screen.findByRole("button", { name: "发布分享" });
  await userEvent.type(
    screen.getByLabelText("你的参观感受或问题"),
    "<img src=x onerror=alert(1)>",
  );
  await userEvent.click(screen.getByText("预览分享内容"));
  expect(
    document.querySelector(".community-text-preview .visitor-text"),
  ).toHaveTextContent("<img src=x onerror=alert(1)>");
  expect(document.querySelector('img[src="x"]')).toBeNull();
  shared.publish.mockRejectedValueOnce(new Error("共享服务连接失败，请重试。"));
  await userEvent.click(screen.getByRole("button", { name: "发布分享" }));
  await screen.findByText(/共享服务连接失败/);
  expect(screen.getByLabelText("你的参观感受或问题")).toHaveValue(
    "<img src=x onerror=alert(1)>",
  );
});
it("shows one complete craft player while preserving readable sections", async () => {
  location.hash = "hub/craft";
  render(<App />);
  const article = document.querySelector("#topic-detail")!;
  expect(article.querySelectorAll(".narration")).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: "背景音乐：聆听完整礼轿故事" }),
  ).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByText("继续阅读：匠艺、婚礼与上海生活"));
  expect(article.querySelectorAll(".chair-reading h3").length).toBe(7);
  expect(article.querySelectorAll(".narration")).toHaveLength(1);
});
