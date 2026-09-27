import { getSession } from "@/lib/auth";
import { getVisibleNews, refId, refName } from "@/lib/data";
import { canManageNews } from "@/lib/rbac";
import { storageModeLabel } from "@/lib/upload";
import { NewsList } from "./NewsList";

export default async function NewsPage() {
  const session = (await getSession())!;
  const rawNews = await getVisibleNews(session);

  // تحويل البيانات لـ JSON safe props
  const news = rawNews.map((n) => ({
    _id: String(n._id),
    title: n.title,
    content: n.content,
    category: n.category,
    scope: n.scope,
    region: refId(n.region),
    regionName: refName(n.region),
    administration: refId(n.administration),
    administrationName: refName(n.administration),
    isPinned: Boolean(n.isPinned),
    published: Boolean(n.published),
    images: (n.images ?? []).map((img) => String(img)),
    authorRole: n.authorRole,
    createdAt: n.createdAt
      ? new Date(n.createdAt).toISOString().slice(0, 10)
      : "",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الأخبار والتعميمات الرياضية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          نشر الأخبار والقرارات ونتائج البطولات ومتابعتها في النطاق الإداري المخصص
          لكل مستوى.
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          💾 {storageModeLabel()}
        </p>
      </div>

      <NewsList
        news={news}
        userRole={session.role}
        userRegionId={session.regionId}
        userAdminId={session.administrationId}
        canCreate={canManageNews(session)}
      />
    </div>
  );
}
