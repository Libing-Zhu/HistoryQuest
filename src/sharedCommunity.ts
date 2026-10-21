import type { Draft } from "./communityStore";
export type SharedMedia = {
  id: string;
  name: string;
  kind: "image" | "video";
  url: string;
  blob?: undefined;
};
export type SharedPost = {
  id: string;
  nickname: string;
  text: string;
  topic: string;
  at: number;
  mine: boolean;
  media: SharedMedia[];
};
export type SharedPage = { posts: SharedPost[]; cursor: string | null };
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api/community/" + path, {
    credentials: "same-origin",
    signal: AbortSignal.timeout(90000),
    ...options,
  }).catch(() => {
    throw new Error("共享服务暂时无法连接，请保留草稿并重试。");
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("共享服务未连接，请使用项目启动脚本打开网站后重试。");
  }
  if (!response.ok)
    throw new Error(data.error || "共享服务暂时无法连接，请保留草稿并重试。");
  return data;
}
export const sharedSession = () => request<{ id: string }>("session");
export const sharedPosts = (cursor?: string) =>
  request<SharedPage>(
    "posts" + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""),
  );
export async function publishShared(draft: Draft) {
  const form = new FormData();
  form.set("nickname", draft.nickname);
  form.set("text", draft.text);
  form.set("topic", draft.topic);
  for (const media of draft.media) form.append("media", media.blob, media.name);
  return request<SharedPost>("posts", { method: "POST", body: form });
}
export const deleteShared = (id: string) =>
  request<{ deleted: boolean }>("posts/" + encodeURIComponent(id), {
    method: "DELETE",
  });
