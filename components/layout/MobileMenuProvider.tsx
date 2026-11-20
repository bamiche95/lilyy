"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type MobileMenuContextValue = {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
};

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

/**
 * One drawer state shared by the header trigger, the visitor tab bar and the
 * sheet itself. Kept separate from the sheet so the tab bar can open the drawer
 * without owning any layout.
 */
export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ open: boolean; pathname: string | null }>({
    open: false,
    pathname,
  });

  // Every navigation closes the drawer — including the language switcher, which
  // pushes a new locale path instead of opening a page. Resetting on the prop
  // change during render is the pattern React recommends over an effect.
  if (state.pathname !== pathname) {
    setState({ open: false, pathname });
  }

  const open = state.pathname === pathname ? state.open : false;
  const openMenu = useCallback(() => setState((current) => ({ ...current, open: true })), []);
  const closeMenu = useCallback(() => setState((current) => ({ ...current, open: false })), []);

  const value = useMemo(() => ({ open, openMenu, closeMenu }), [open, openMenu, closeMenu]);

  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>;
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);

  if (!context) {
    throw new Error("useMobileMenu must be used inside MobileMenuProvider");
  }

  return context;
}
