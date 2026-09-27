import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { FollowUp } from "@/models/FollowUp";
import { getScopedInstitutes } from "@/lib/data";
import { FollowUpCard, type FollowUpItem } from "./FollowUpCard";

export default async function FollowUpPage() {
  const session = (await getSession())!;
  await dbConnect();

  const scopedInstitutes = await getScopedInstitutes(session);
  const instIds = scopedInstitutes.map((i) => i._id);

  const raw = await FollowUp.find({ institute: { $in: instIds } })
    .populate("event", "title sport season status")
    .populate("institute", "name stage code")
    .populate("region", "name")
    .populate("administration", "name")
    .sort({ updatedAt: -1 })
    .lean();

  const followups: FollowUpItem[] = raw.map((f) => ({
    _id: String(f._id),
    status: f.status,
    teamSize: f.teamSize,
    score: f.score,
    rank: f.rank,
    notes: f.notes,
    event: f.event as unknown as { title?: string; sport?: string },
    institute: f.institute as unknown as { name?: string; stage?: string },
    region: f.region as unknown as { name?: string },
    administration: f.administration as unknown as { name?: string },
  }));

  const isInstitute = session.role === "institute";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          المتابعات الشهرية والميدانية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isInstitute
            ? "تسجيل حالة مشاركة المعهد وقوام الفريق والنتائج المحققة."
            : "متابعة ورصد استجابة المعاهد التابعة لنطاقك وحصر نتائج البطولات."}
        </p>
      </div>

      <div className="space-y-4">
        {followups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            لا توجد سجلات متابعة بعد. يتم إنشاء السجلات فور قيام الإدارة بنشر أي فعالية.
          </div>
        ) : (
          followups.map((fu) => (
            <FollowUpCard key={fu._id} fu={fu} isInstitute={isInstitute} />
          ))
        )}
      </div>
    </div>
  );
}
