import type { RolUsuario } from "@/lib/db/schema";

declare module "next-auth" {
  interface User {
    rol?: RolUsuario;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      rol: RolUsuario;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: RolUsuario;
    name?: string | null;
    picture?: string | null;
  }
}
