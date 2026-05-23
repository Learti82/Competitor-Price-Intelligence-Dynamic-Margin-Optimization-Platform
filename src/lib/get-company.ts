import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function getAuthUser() {
  const { userId } = await auth();
  return userId;
}

export async function requireCompany() {
  const { userId } = await auth();
  if (!userId) return null;

  const company = await db.company.findFirst({
    where: { clerkOrgId: userId },
  });

  return company;
}

export async function requireCompanyOrInit() {
  const { userId } = await auth();
  if (!userId) return null;

  let company = await db.company.findFirst({
    where: { clerkOrgId: userId },
  });

  if (!company) {
    const user = await currentUser();
    const displayName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "My Company";

    company = await db.company.create({
      data: {
        clerkOrgId: userId,
        name: displayName,
        slug: `company-${userId.slice(-8)}`,
        hqCity: "Prishtinë",
        numberOfStores: 1,
        currency: "EUR",
        country: "XK",
        subscriptionTier: "pro",
      },
    });

    await db.companyUser.create({
      data: {
        clerkUserId: userId,
        companyId: company.id,
        role: "ADMIN",
        name: displayName,
        email: user?.emailAddresses?.[0]?.emailAddress ?? "",
      },
    });
  }

  return company;
}

export async function getActorName() {
  const user = await currentUser();
  if (!user) return "Unknown User";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.emailAddresses?.[0]?.emailAddress ?? "Unknown User";
}
