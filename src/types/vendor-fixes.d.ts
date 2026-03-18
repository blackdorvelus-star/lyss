import "@supabase/supabase-js";

declare module "@supabase/supabase-js" {
  export type Session = any;

  interface SupabaseAuthClient {
    signUp(credentials: any): Promise<any>;
    signInWithPassword(credentials: any): Promise<any>;
    getUser(jwt?: string): Promise<any>;
    getSession(): Promise<any>;
    onAuthStateChange(
      callback: (event: any, session: Session | null) => void,
    ): { data: { subscription: { unsubscribe: () => void } } };
    signOut(): Promise<any>;
  }
}

declare module "@testing-library/jest-dom";

export {};
