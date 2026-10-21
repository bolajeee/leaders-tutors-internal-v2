import { apiClient } from "@/lib/api-client";
import {
  DashboardSummary,
  TutorialSubject,
  PaymentStatus,
  TutorialVideo,
  UserEnrollment,
  UserSubscription,
  ClassVideo,
  SubjectWithVideos,
  YearGroup,
} from "@/types/portal";
import { useAuthStore } from "@/store/authStore";

type RecordLike = Record<string, unknown>;

interface ApiErrorLike {
  status?: number;
  response?: { status?: number };
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const apiError = error as ApiErrorLike;
  return apiError.status ?? apiError.response?.status;
};

const inactiveSubscription = (): UserSubscription => ({
  isSubscriptionActive: false,
  subscriptionExpiresAt: new Date().toISOString(),
  subscriptionType: "basic",
  walletBalance: 0,
  currency: "₦",
  departmentId: "",
  departmentName: "",
  examId: "",
  examAbbreviation: "",
});

const asRecord = (value: unknown): RecordLike => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as RecordLike;
  }
  return {};
};

const unwrapPayload = (value: unknown): unknown => {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    const record = asRecord(current);
    if (record.data !== undefined) {
      current = record.data;
      continue;
    }
    break;
  }
  return current;
};

const asArray = (value: unknown): RecordLike[] => {
  const payload = unwrapPayload(value);
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is RecordLike =>
        !!item && typeof item === "object" && !Array.isArray(item),
    );
  }

  const record = asRecord(payload);
  const nestedKeys = ["items", "subjects", "tutorials", "years", "records"];
  for (const key of nestedKeys) {
    if (Array.isArray(record[key])) {
      return (record[key] as unknown[]).filter(
        (item): item is RecordLike =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
    }
  }

  return [];
};

const asString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};

const firstString = (source: RecordLike, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return fallback;
};

const tutorialDocumentDirectories: Record<string, string> = {
  tutorialPicturesPath: "tutorialPictures",
  tutorialVideosPath: "tutorialVideos",
  tutorialMaterialsPath: "tutorialMaterials",
};

const getDefaultDocumentPath = (pathKey: string): string => {
  const directory = tutorialDocumentDirectories[pathKey];
  const apiBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!directory || !apiBaseUrl) return "";

  try {
    const apiOrigin = new URL(apiBaseUrl).origin;
    return `${apiOrigin}/external-admin/uploaded_files/${directory}`;
  } catch {
    return "";
  }
};

const resolveDocumentUrl = (
  item: RecordLike,
  fileKeys: string[],
  pathKey: string,
): string | undefined => {
  const file = firstString(item, fileKeys);
  if (!file) return undefined;

  // Some API variants already return a complete URL.
  if (/^(?:https?:)?\/\//i.test(file) || /^(?:data|blob):/i.test(file)) {
    return file;
  }

  const documentPath = asRecord(item.documentPath);
  const basePath =
    asString(documentPath[pathKey]) || getDefaultDocumentPath(pathKey);
  if (!basePath) return file;

  return `${basePath.replace(/\/+$/, "")}/${file.replace(/^\/+/, "")}`;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const firstNumber = (source: RecordLike, keys: string[], fallback = 0) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return asNumber(source[key], fallback);
    }
  }
  return fallback;
};

const isActiveStatus = (source: RecordLike): boolean => {
  if (typeof source.isSubscriptionActive === "boolean") {
    return source.isSubscriptionActive;
  }
  if (typeof source.isActive === "boolean") {
    return source.isActive;
  }

  const status = firstString(source, [
    "status",
    "subscriptionStatus",
  ]).toLowerCase();
  if (
    ["expired", "inactive", "cancelled", "canceled", "failed"].includes(status)
  ) {
    return false;
  }
  if (["active", "success", "valid"].includes(status)) {
    return true;
  }

  const statusId = firstString(source, ["statusId"]);
  if (statusId === "1" || statusId === "4") return true;
  if (statusId === "2" || statusId === "5") return false;

  return Boolean(
    firstString(source, ["departmentId", "examId", "subscriptionId", "userId"]),
  );
};

const mapSubscription = (raw: unknown): UserSubscription => {
  // apiClient already unwraps the outer envelope — raw IS the data object:
  // { subscriptionId, statusId, daysLeft, subscriptionStartDate, subscriptionEndDate, statusData: { statusId, statusName } }
  const data = asRecord(raw);

  // statusData is nested: { statusId, statusName }
  const statusData = asRecord(data.statusData);
  const statusName = asString(statusData.statusName).toUpperCase();

  // Active when statusId === 1 or statusName is ACTIVE
  const statusId = asString(data.statusId ?? statusData.statusId);
  const isActive =
    statusId === "1" || statusName === "ACTIVE" || statusName === "ACTIVE!";

  // daysLeft comes directly from the API
  const daysLeft = asNumber(data.daysLeft, 0);

  // Subscription end date
  const expiresAt = asString(
    data.subscriptionEndDate ?? data.expiresAt ?? data.expiryDate ?? "",
  );

  // departmentId / examId are NOT in the subscription response —
  // they live in userEnrollment (persisted from signup). Pull them from the
  // store so the rest of the app (tutorials, etc.) still gets them.
  const storedEnrollment = useAuthStore.getState().userEnrollment;

  return {
    isSubscriptionActive: isActive && daysLeft > 0,
    subscriptionExpiresAt: expiresAt || new Date().toISOString(),
    subscriptionType: "basic",
    walletBalance: asNumber(data.walletBalance ?? data.balance, 0),
    currency: asString(data.currency, "₦"),
    departmentId: asString(
      data.departmentId,
      storedEnrollment?.departmentId ?? "",
    ),
    departmentName: asString(
      data.departmentName ?? data.department,
      storedEnrollment?.departmentName ?? "",
    ),
    examId: asString(data.examId, storedEnrollment?.examId ?? ""),
    examAbbreviation: asString(
      data.examAbbreviation ?? data.examAbbr,
      storedEnrollment?.examAbbreviation ?? "",
    ),
    lastPaymentDate:
      asString(data.subscriptionStartDate ?? data.createdAt) || undefined,
    subscriptionId: asString(data.subscriptionId) || undefined,
    daysLeft,
    statusName,
  };
};

const enrollmentFromSubscription = (
  subscription: UserSubscription,
): UserEnrollment | null => {
  if (!subscription.departmentId && !subscription.examId) {
    return null;
  }

  return {
    departmentId: subscription.departmentId,
    departmentName: subscription.departmentName,
    examId: subscription.examId,
    examAbbreviation: subscription.examAbbreviation,
    status: subscription.isSubscriptionActive ? "active" : "expired",
  };
};

const mapSubject = (
  item: RecordLike,
  enrollment?: UserEnrollment | UserSubscription | null,
): TutorialSubject => {
  // API returns snake_case (subject_id, subject_name) — handle both
  const id = firstString(item, ["subjectId", "subject_id", "id"]);
  return {
    id,
    name: firstString(item, ["subjectName", "subject_name", "name"], "Subject"),
    departmentId: firstString(
      item,
      ["departmentId"],
      enrollment?.departmentId || "",
    ),
    department: firstString(
      item,
      ["departmentName", "department"],
      enrollment?.departmentName || "",
    ),
    examId: firstString(item, ["examId"], enrollment?.examId || ""),
    exam: firstString(
      item,
      ["examAbbreviation", "examAbbr", "examTitle", "exam"],
      enrollment?.examAbbreviation || "",
    ),
    examAbbr: firstString(
      item,
      ["examAbbreviation", "examAbbr"],
      enrollment?.examAbbreviation || "",
    ),
  };
};

const mapClassVideo = (item: RecordLike, yearLabel?: string): ClassVideo => {
  const year =
    yearLabel ||
    firstString(item, ["yearValue", "year", "yearName"], "Unknown year");

  return {
    id: firstString(item, ["tutorialId", "id"]),
    title: firstString(item, ["tutorialTitle", "title"], "Tutorial"),
    year,
    yearId: firstString(item, ["yearId"]) || undefined,
    duration: firstString(item, ["tutorialDuration", "duration"]) || undefined,
    subjectId: firstString(item, ["subjectId"]),
    description:
      firstString(item, ["tutorialDescription", "description"]) || undefined,
    thumbnailUrl: resolveDocumentUrl(
      item,
      ["tutorialPicture", "thumbnailUrl", "thumbnail"],
      "tutorialPicturesPath",
    ),
  };
};

const mapTutorialVideo = (item: RecordLike): TutorialVideo => {
  const classVideo = mapClassVideo(item);
  const subjectData = asRecord(item.subjectData);
  const yearData = asRecord(item.yearData);
  const departmentData = asRecord(item.departmentData);
  const examData = asRecord(item.examData);
  return {
    id: classVideo.id,
    title: classVideo.title,
    subject:
      firstString(item, ["subjectName", "subject"]) ||
      firstString(subjectData, ["subject_name", "subjectName"]),
    department:
      firstString(item, ["departmentName", "department"]) ||
      firstString(departmentData, ["departmentName", "name"]),
    exam:
      firstString(item, ["examAbbreviation", "examAbbr", "exam"]) ||
      firstString(examData, ["examAbbreviation", "examName", "name"]),
    year: firstString(yearData, ["yearValue", "year"]) || classVideo.year,
    videoUrl:
      resolveDocumentUrl(
        item,
        ["tutorialVideo", "tutorialVideoUrl", "videoUrl", "video"],
        "tutorialVideosPath",
      ) || "",
    thumbnailUrl: classVideo.thumbnailUrl,
    materialUrl: resolveDocumentUrl(
      item,
      ["tutorialMaterial", "tutorialMaterialUrl", "materialUrl", "material"],
      "tutorialMaterialsPath",
    ),
    duration: classVideo.duration,
    description: classVideo.description,
  };
};

export const fetchUserSubscription = async (): Promise<UserSubscription> => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return inactiveSubscription();
  }

  if (process.env.NEXT_PUBLIC_CURRICULUM_SOURCE !== "api") {
    const enrollment = useAuthStore.getState().userEnrollment;
    return {
      isSubscriptionActive: true,
      subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      subscriptionType: "Student plan",
      walletBalance: 9000,
      currency: "₦",
      departmentId: enrollment?.departmentId ?? "basic",
      departmentName: enrollment?.departmentName ?? "Basic School",
      examId: enrollment?.examId ?? "basic-5",
      examAbbreviation: enrollment?.examAbbreviation ?? "Basic 5",
      lastPaymentDate: new Date().toISOString(),
      subscriptionId: "SUB-DEMO-1001",
      daysLeft: 30,
      statusName: "ACTIVE",
    };
  }

  try {
    const data = await apiClient.get<unknown>(
      "/user/accounts/fetch-user-subscription",
    );
    const subscription = mapSubscription(data);
    const enrollment = enrollmentFromSubscription(subscription);
    if (enrollment) {
      useAuthStore.getState().setUserEnrollment(enrollment);
    }
    return subscription;
  } catch (error: unknown) {
    const status = getErrorStatus(error);
    if (status === 401 || status === 403 || status === 404) {
      return inactiveSubscription();
    }
    throw error;
  }
};

export const checkPaymentStatus = async (): Promise<PaymentStatus> => {
  const subscription = await fetchUserSubscription();
  return {
    isSubscriptionActive: subscription.isSubscriptionActive,
    subscriptionExpiresAt: subscription.subscriptionExpiresAt,
    subscriptionType: subscription.subscriptionType,
    walletBalance: subscription.walletBalance,
    currency: subscription.currency,
    lastPaymentDate: subscription.lastPaymentDate,
    nextBillingDate: subscription.nextBillingDate,
  };
};

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const token = useAuthStore.getState().token;
  if (!token) {
    return {
      subscriptionExpiresIn: 0,
      walletBalance: 0,
      currency: "₦",
      subscriptionStatus: "expired",
      subscriptionType: "basic",
    };
  }

  const subscription = await fetchUserSubscription();
  // Use daysLeft directly from API response — it's pre-calculated by the backend
  const daysUntilExpiration = subscription.daysLeft ?? 0;

  return {
    subscriptionExpiresIn: daysUntilExpiration,
    walletBalance: subscription.walletBalance,
    currency: subscription.currency,
    subscriptionStatus: subscription.isSubscriptionActive
      ? "active"
      : "expired",
    subscriptionType: subscription.subscriptionType,
  };
};

export const fetchUserEnrollment = async (): Promise<UserEnrollment | null> => {
  const subscription = await fetchUserSubscription();
  return enrollmentFromSubscription(subscription);
};

export const fetchTutorialSubjects = async (
  userEnrollment?: UserEnrollment | null,
): Promise<TutorialSubject[]> => {
  const enrollment = userEnrollment || useAuthStore.getState().userEnrollment;

  const query = enrollment?.departmentId
    ? `?departmentId=${encodeURIComponent(enrollment.departmentId)}`
    : "";

  try {
    const data = await apiClient.get<unknown>(
      `/preset-data/fetch-external-subjects${query}`,
    );

    return asArray(data)
      .map((item) => mapSubject(item, enrollment))
      .filter((subject) => subject.id);
  } catch (error) {
    console.error("Tutorial subjects fetch failed:", error);
    return [];
  }
};

export const fetchTutorialsByDepartmentAndExam = async (
  departmentId: string,
  examId: string,
  subjectId?: string,
): Promise<ClassVideo[]> => {
  const subjects = await fetchSubjectsWithVideos(departmentId, examId);
  const filtered = subjectId
    ? subjects.filter((s) => s.subjectId === subjectId)
    : subjects;
  return filtered.flatMap((s) => s.yearGroups.flatMap((yg) => yg.videos));
};

export const fetchSubjectsWithVideos = async (
  departmentId = "",
  examId = "",
): Promise<SubjectWithVideos[]> => {
  // The student endpoint resolves enrollment from the authenticated user.
  const raw = await apiClient.get<unknown>(
    "/user/tutorials/fetch-tutorials-by-department-and-exam",
  );

  // apiClient already strips the outer envelope — raw IS the data array:
  // [ { yearId, yearValue, subjects: [ { subjectId, subjectData, tutorials: [] } ] } ]
  const years = asArray(raw);

  // Build a map: subjectId → { meta, years: Map<yearId, YearGroup> }
  const subjectMap = new Map<
    string,
    { name: string; yearMap: Map<string, YearGroup> }
  >();

  for (const yearItem of years) {
    const yearRec = asRecord(yearItem);
    const yearLabel = asString(yearRec.yearValue); // number → string, e.g. "2024"
    const yearId = asString(yearRec.yearId);
    if (!yearLabel || !yearId) continue;

    const subjectEntries = Array.isArray(yearRec.subjects)
      ? (yearRec.subjects as unknown[])
      : [];

    for (const subjectEntry of subjectEntries) {
      const subRec = asRecord(subjectEntry);
      const sid = asString(subRec.subjectId);
      if (!sid) continue;

      // Subject name lives in subjectData.subject_name
      const subjectData = asRecord(subRec.subjectData);
      const sName =
        asString(subjectData.subject_name) ||
        asString(subjectData.subjectName) ||
        asString(subRec.subjectName) ||
        sid;

      if (!subjectMap.has(sid)) {
        subjectMap.set(sid, { name: sName, yearMap: new Map() });
      }
      const entry = subjectMap.get(sid)!;

      // Build videos for this year + subject
      const tutorials = Array.isArray(subRec.tutorials)
        ? (subRec.tutorials as unknown[])
        : [];

      const videos = tutorials.reduce<ClassVideo[]>((acc, t) => {
        const tr = asRecord(t);
        if (asString(tr.statusName).toUpperCase() === "INACTIVE") return acc;
        const id = asString(tr.tutorialId ?? tr.id);
        if (!id) return acc;
        acc.push({
          id,
          title: asString(tr.tutorialTitle ?? tr.title, "Tutorial"),
          year: yearLabel,
          yearId,
          subjectId: sid,
          duration: asString(tr.tutorialDuration ?? tr.duration) || undefined,
          description:
            asString(tr.tutorialDescription ?? tr.description) || undefined,
          thumbnailUrl: resolveDocumentUrl(
            {
              ...tr,
              documentPath:
                tr.documentPath ?? subRec.documentPath ?? yearRec.documentPath,
            },
            ["tutorialPicture", "thumbnailUrl", "thumbnail"],
            "tutorialPicturesPath",
          ),
        });
        return acc;
      }, []);

      // Keep every subject/year association, including years awaiting content.
      if (!entry.yearMap.has(yearId)) {
        entry.yearMap.set(yearId, { yearId, yearLabel, videos: [] });
      }
      entry.yearMap.get(yearId)!.videos.push(...videos);
    }
  }

  const enrollment = useAuthStore.getState().userEnrollment;

  return Array.from(subjectMap.entries()).map(([sid, { name, yearMap }]) => ({
    subjectId: sid,
    subjectName: name,
    departmentId: enrollment?.departmentId ?? departmentId,
    examId: enrollment?.examId ?? examId,
    // Sort year groups newest-first
    yearGroups: Array.from(yearMap.values()).sort((a, b) =>
      b.yearLabel.localeCompare(a.yearLabel, undefined, { numeric: true }),
    ),
  }));
};

export const fetchTutorialById = async (
  tutorialId: string,
): Promise<TutorialVideo | null> => {
  const response = await apiClient.getEnvelope<unknown>(
    `/user/tutorials/fetch-tutorial-by-id?tutorialId=${encodeURIComponent(tutorialId)}`,
  );

  const payload = unwrapPayload(response.data);
  const record = Array.isArray(payload)
    ? asArray(payload)[0]
    : asRecord(payload);

  if (!record || !firstString(record, ["tutorialId", "id"])) {
    return null;
  }

  return mapTutorialVideo({
    ...record,
    departmentData: record.departmentData ?? response.departmentData,
    examData: record.examData ?? response.examData,
  });
};

export const fetchTutorialVideos = async (
  subjectId: string,
): Promise<ClassVideo[]> => {
  const enrollment = useAuthStore.getState().userEnrollment;

  return fetchTutorialsByDepartmentAndExam(
    enrollment?.departmentId ?? "",
    enrollment?.examId ?? "",
    subjectId,
  );
};
