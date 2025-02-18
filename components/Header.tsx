"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const NavItems = () => (
    <>
      <li>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          ホーム
        </Link>
      </li>
      {session?.user ? (
        <>
          {session.user.isAdmin && (
            <li>
              <Link href="/users" className="text-gray-600 hover:text-gray-900">
                ユーザー管理
              </Link>
            </li>
          )}
          <li>
            <Link
              href="#"
              className="text-gray-600 hover:text-gray-900"
              onClick={(e) => {
                e.preventDefault();
                signOut({ callbackUrl: "/" });
              }}
            >
              ログアウト
            </Link>
          </li>
        </>
      ) : (
        <li>
          <Button
            variant="link"
            className="text-gray-600 hover:text-gray-900 p-0 m-0 inline"
            onClick={() => signIn("google")}
          >
            ログイン
          </Button>
        </li>
      )}
    </>
  );

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="text-xl font-bold">
          <Link href="/">Tourist Log</Link>
        </div>
        <nav className="hidden md:block">
          <ul className="flex items-center space-x-4">
            <NavItems />
          </ul>
        </nav>
        <div className="md:hidden">
          <Button variant="ghost" onClick={toggleMenu}>
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden flex justify-end">
          <ul className="p-4 space-y-2">
            <NavItems />
          </ul>
        </div>
      )}
    </header>
  );
}
