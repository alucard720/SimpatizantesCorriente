export const publicRegistrationSelect = {
    id: true,
    firstName: true,
    lastName: true,
    status: true,
    createdAt: true,
    schoolName: true,
    municipality: {
        select: {
            id: true,
            name: true,
            province: { select: { id: true, name: true } },
        },
    },
    school: { select: { id: true, name: true } },
};
export function registrationScope(auth) {
    if (!auth)
        return { id: { in: [] } };
    return auth.role === "ADMIN"
        ? {}
        : { municipalityId: { in: auth.municipalityIds } };
}
