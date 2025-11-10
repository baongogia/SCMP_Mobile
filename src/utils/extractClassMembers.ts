export interface ClassMemberInfo {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: "instructor" | "student" | "other";
}

const MEMBER_KEYS = [
  "member",
  "members",
  "member_list",
  "class_member",
  "class_members",
  "student",
  "students",
  "student_list",
  "students_list",
  "learners",
  "participants",
  "participant",
  "trainees",
  "registrations",
  "enrollments",
  "attendees",
  "users",
];

const INSTRUCTOR_KEYS = [
  "instructor",
  "instructors",
  "teacher",
  "teachers",
  "trainer",
  "trainers",
  "mentor",
  "mentors",
];

const NESTED_ARRAY_KEYS = [
  "data",
  "items",
  "rows",
  "list",
  "results",
  "value",
  "values",
];

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const ensureArray = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (isObject(value)) {
    for (const key of NESTED_ARRAY_KEYS) {
      const nested = value[key];
      if (Array.isArray(nested)) return nested;
    }
  }
  return [];
};

const pickString = (...values: any[]): string | undefined => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value);
    }
  }
  return undefined;
};

const extractAvatar = (entity: any): string | undefined => {
  if (!entity) return undefined;
  const candidates = [
    entity?.avatar?.path,
    entity?.avatar_path,
    entity?.avatarUrl,
    entity?.avatar_url,
    Array.isArray(entity?.avatar) ? entity.avatar[0]?.path : undefined,
    entity?.profile_picture,
    entity?.profileImage,
    entity?.photo,
    entity?.image,
    entity?.featured_image?.path,
    Array.isArray(entity?.featured_image)
      ? entity.featured_image[0]?.path
      : undefined,
  ];
  return pickString(...candidates);
};

const normalizeMember = (
  input: any,
  fallbackRole: ClassMemberInfo["role"],
  index: number
): ClassMemberInfo => {
  const entity = input?.user || input?.member || input?.profile || input;

  const name =
    pickString(
      entity?.full_name,
      entity?.name,
      entity?.username,
      entity?.display_name,
      entity?.title,
      input?.full_name,
      input?.name,
      input?.username
    ) || "Thành viên";

  const email = pickString(
    entity?.email,
    entity?.mail,
    entity?.contact?.email,
    input?.email,
    input?.mail
  );

  const phone = pickString(
    entity?.phone,
    entity?.mobile,
    entity?.contact_phone,
    entity?.contact?.phone,
    input?.phone,
    input?.mobile
  );

  const avatar =
    extractAvatar(entity) ||
    extractAvatar(input) ||
    pickString(entity?.avatar, input?.avatar);

  const id =
    pickString(
      entity?._id,
      entity?.id,
      entity?.user_id,
      entity?.member_id,
      entity?.student_id,
      entity?.participant_id,
      input?._id,
      input?.id
    ) || `${fallbackRole || "member"}-${index}`;

  return {
    _id: String(id),
    name,
    email,
    phone,
    avatar,
    role: fallbackRole,
  };
};

const traverseForMembers = (root: any) => {
  const visited = new Set<any>();
  const stack: any[] = [];
  if (root !== undefined) {
    stack.push(root);
  }

  let membersArray: any[] | null = null;
  const instructorNodes: any[] = [];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (visited.has(node)) continue;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        stack.push(item);
      }
      continue;
    }

    if (!isObject(node)) continue;

    // capture instructors if present
    for (const key of INSTRUCTOR_KEYS) {
      if (node[key]) {
        const instructorValue = node[key];
        const arrayValue = ensureArray(instructorValue);
        if (arrayValue.length > 0) {
          instructorNodes.push(...arrayValue);
        } else if (isObject(instructorValue)) {
          instructorNodes.push(instructorValue);
        }
      }
    }

    // capture members if not already found
    if (!membersArray) {
      for (const key of MEMBER_KEYS) {
        if (!node[key]) continue;
        const arr = ensureArray(node[key]);
        if (arr.length > 0) {
          membersArray = arr;
          break;
        }
      }
    }

    // traverse nested values
    for (const value of Object.values(node)) {
      if (value && (typeof value === "object" || Array.isArray(value))) {
        stack.push(value);
      }
    }
  }

  return {
    members: membersArray ?? [],
    instructors: instructorNodes,
  };
};

export const extractClassMembersFromResponse = (
  response: any
): ClassMemberInfo[] => {
  const payload = response?.data ?? response;
  const { members, instructors } = traverseForMembers(payload);

  const normalizedMembers = members.map((item, index) =>
    normalizeMember(item, "student", index)
  );

  const normalizedInstructors = instructors.map((item, index) =>
    normalizeMember(item, "instructor", index)
  );

  const combined = [...normalizedInstructors, ...normalizedMembers];

  const unique: ClassMemberInfo[] = [];
  const seen = new Set<string>();
  const rolePriority: Record<string, number> = {
    instructor: 0,
    student: 1,
    other: 2,
  };

  combined.forEach((member, index) => {
    const key = `${member._id}|${member.role || "member"}`;
    if (seen.has(key)) return;
    seen.add(key);

    unique.push({
      ...member,
      _id: member._id || `member-${index}`,
      role: member.role || "student",
    });
  });

  unique.sort((a, b) => {
    const roleDiff =
      (rolePriority[a.role || "student"] ?? 99) -
      (rolePriority[b.role || "student"] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
  });

  return unique;
};
