"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, MapPin, Compass, User } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const NavItems = () => (
    <>
      <li>
        <Link
          href="/"
          className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors focus:outline-none"
        >
          <MapPin size={16} />
          <span>ホーム</span>
        </Link>
      </li>
      {session?.user ? (
        <>
          {session.user.isAdmin && (
            <li>
              <Link
                href="/users"
                className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors focus:outline-none"
              >
                <User size={16} />
                <span>ユーザー管理</span>
              </Link>
            </li>
          )}
          <li>
            <button
              className="flex items-center space-x-1 p-0 text-foreground hover:text-primary active:text-primary focus:text-primary focus:outline-none transition-colors"
              onClick={(e) => {
                e.preventDefault();
                signOut({ callbackUrl: "/" });
              }}
            >
              <User size={16} />
              <span>ログアウト</span>
            </button>
          </li>
        </>
      ) : (
        <li>
          <Link href="/login">
            <button className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium rounded-md border border-primary text-primary hover:text-primary/80 hover:bg-transparent focus:text-primary focus:outline-none transition-colors">
              サインアップ・ログイン
            </button>
          </Link>
        </li>
      )}
    </>
  );

  return (
    <header className="bg-gradient-to-r from-primary/10 to-secondary/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        <div className="flex items-center space-x-2">
          <Compass className="text-primary" size={28} />
          <Link
            href="/"
            className="text-xl font-bold text-foreground hover:text-primary transition-colors focus:outline-none"
          >
            Tourist <span className="text-primary">Log</span>
          </Link>
        </div>
        <nav className="hidden md:block">
          <ul className="flex items-center space-x-6">
            <NavItems />
          </ul>
        </nav>
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary hover:bg-muted/50 focus:outline-none transition-colors"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <ul className="space-y-4">
            <NavItems />
          </ul>
        </div>
      )}
    </header>
  );
}
