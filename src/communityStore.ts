export const COMMUNITY_TOPICS = [
  "百子大礼轿",
  "匠艺与婚俗",
  "上海城市记忆",
  "参观体验",
] as const;
export type Attachment = {
  id: string;
  name: string;
  kind: "image" | "video";
  blob: Blob;
};
export type Reply = {
  id: string;
  owner: string;
  nickname: string;
  text: string;
  at: number;
};
export type Post = {
  id: string;
  owner: string;
  nickname: string;
  text: string;
  topic: string;
  at: number;
  media: Attachment[];
  replies: Reply[];
};
export type Draft = {
  nickname: string;
  text: string;
  topic: string;
  media: Attachment[];
};
export const emptyDraft = (): Draft => ({
  nickname: "",
  text: "",
  topic: COMMUNITY_TOPICS[0],
  media: [],
});
let connection: Promise<IDBDatabase> | undefined;
const DB = "historyquest-community-v1";
function database(): Promise<IDBDatabase> {
  if (connection) return connection;
  connection = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("此浏览器无法使用本地存储，请更换浏览器后重试。"));
      return;
    }
    const request = indexedDB.open(DB, 1);
    const timeout = setTimeout(
      () => reject(new Error("本地存储未能及时打开，请关闭其他旧页面后重试。")),
      6000,
    );
    request.onupgradeneeded = () => {
      request.result.createObjectStore("posts", { keyPath: "id" });
      request.result.createObjectStore("settings");
    };
    request.onsuccess = () => {
      clearTimeout(timeout);
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        connection = undefined;
      };
      resolve(db);
    };
    request.onerror = () => {
      clearTimeout(timeout);
      reject(request.error);
    };
    request.onblocked = () => {
      clearTimeout(timeout);
      reject(new Error("请关闭其他旧页面后重试本地存储。"));
    };
  });
  connection.catch(() => {
    connection = undefined;
  });
  return connection;
}
async function transaction<T>(
  store: "posts" | "settings",
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, result: (value: T) => void) => void,
): Promise<T> {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    let value: T;
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error || new Error("本地保存失败，请重试。"));
    tx.onabort = () => reject(tx.error || new Error("本地保存失败，请重试。"));
    operation(tx.objectStore(store), (result) => {
      value = result;
    });
  });
}
export const newId = () => crypto.randomUUID();
export async function localIdentity() {
  return transaction<string>("settings", "readwrite", (store, result) => {
    const request = store.get("identity");
    request.onsuccess = () => {
      const id = request.result || newId();
      store.put(id, "identity");
      result(id);
    };
  });
}
export async function readPosts() {
  return transaction<Post[]>("posts", "readonly", (store, result) => {
    const request = store.getAll();
    request.onsuccess = () =>
      result(
        (request.result as Post[]).sort(
          (a, b) => b.at - a.at || b.id.localeCompare(a.id),
        ),
      );
  });
}
export async function readDraft() {
  return transaction<Draft>("settings", "readonly", (store, result) => {
    const request = store.get("draft");
    request.onsuccess = () => result(request.result || emptyDraft());
  });
}
export async function writeDraft(draft: Draft) {
  return transaction<void>("settings", "readwrite", (store) => {
    store.put(draft, "draft");
  });
}
export async function publishPost(draft: Draft, owner: string) {
  const text = draft.text.trim();
  if (!text && !draft.media.length)
    throw new Error("写下一个发现，或添加照片、视频后再发布。");
  if (text.length > 2000 || draft.nickname.trim().length > 24)
    throw new Error("请缩短分享内容或昵称后重试。");
  if (
    !owner ||
    !COMMUNITY_TOPICS.includes(draft.topic as (typeof COMMUNITY_TOPICS)[number])
  )
    throw new Error("请选择一个讨论主题后重试。");
  if (
    draft.media.filter((m) => m.kind === "image").length > 3 ||
    draft.media.filter((m) => m.kind === "video").length > 1
  )
    throw new Error("每条分享最多3张照片和1个视频。");
  const post: Post = {
    ...draft,
    nickname: draft.nickname.trim() || "匿名游客",
    text,
    media: [...draft.media],
    id: newId(),
    owner,
    at: Date.now(),
    replies: [],
  };
  // Post publication and draft removal commit together.
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["posts", "settings"], "readwrite");
    tx.objectStore("posts").add(post);
    tx.objectStore("settings").delete("draft");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return post;
}
async function changePost(
  id: string,
  owner: string,
  change: (post: Post) => Post | null,
) {
  return transaction<void>("posts", "readwrite", (store) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const post = request.result as Post | undefined;
      if (!post || !owner) return;
      const next = change(post);
      if (next) store.put(next);
      else store.delete(id);
    };
  });
}
export async function addReply(
  id: string,
  owner: string,
  nickname: string,
  text: string,
) {
  if (!text.trim() || text.trim().length > 500)
    throw new Error("回复请填写1—500字。");
  await changePost(id, owner, (post) => ({
    ...post,
    replies: [
      ...post.replies,
      {
        id: newId(),
        owner,
        nickname: nickname.trim().slice(0, 24) || "匿名游客",
        text: text.trim(),
        at: Date.now(),
      },
    ],
  }));
}
export async function removePost(id: string, owner: string) {
  await changePost(id, owner, (post) => (post.owner === owner ? null : post));
}
export async function removeReply(id: string, replyId: string, owner: string) {
  await changePost(id, owner, (post) => ({
    ...post,
    replies: post.replies.filter(
      (reply) => reply.id !== replyId || reply.owner !== owner,
    ),
  }));
}
export function storageMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return "浏览器存储空间不足。草稿仍保留在当前页面，可移除较大附件后重试。";
  return error instanceof Error
    ? error.message
    : "本地保存暂时失败，请保留当前页面并重试。";
}
