import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { FireIcon, ServerStackIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import type { User } from "~/auth";
import type { Namespace } from "~/kubernetes-types";
import { Link, useLocation } from "@remix-run/react";

const navigation = [
  { name: "Machines", href: "/machines", icon: ServerStackIcon },
  { name: "Events", href: "/events", icon: FireIcon },
];

const userNavigation = [{ name: "Logout", href: "/auth/logout" }];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export interface AppLayoutProps {
  children: React.ReactNode;
  currentNamespace: string | undefined;
  namespaces: Namespace[];
  user: User;
}

export function AppLayout({
  children,
  currentNamespace,
  namespaces,
  user,
}: AppLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div>
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-white">Monsoon</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={`/namespaces/${currentNamespace}${item.href}`}
                        className={classNames(
                          pathname.includes(
                            `/namespaces/${currentNamespace}${item.href}`,
                          )
                            ? "bg-indigo-700 text-white"
                            : "text-indigo-200 hover:text-white hover:bg-indigo-700",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                        )}
                      >
                        <item.icon
                          className={classNames(
                            pathname.includes(
                              `/namespaces/${currentNamespace}${item.href}`,
                            )
                              ? "text-white"
                              : "text-indigo-200 group-hover:text-white",
                            "h-6 w-6 shrink-0",
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-indigo-200">
                  Namespaces
                </div>
                <ul className="-mx-2 mt-2 space-y-1">
                  {namespaces.map((namespace) => (
                    <li key={namespace.metadata.name}>
                      <Link
                        to={`/namespaces/${namespace.metadata.name}/machines`}
                        className={classNames(
                          currentNamespace === namespace.metadata.name
                            ? "bg-indigo-700 text-white"
                            : "text-indigo-200 hover:text-white hover:bg-indigo-700",
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold",
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-indigo-400 bg-indigo-500 text-[0.625rem] font-medium text-white">
                          {namespace.metadata.name[0]}
                        </span>
                        <span className="truncate">
                          {namespace.metadata.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white shadow-sm px-8">
          <div className="flex flex-1 self-stretch gap-x-6">
            <div className="flex items-center gap-x-6 ml-auto">
              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="-m-1.5 flex items-center p-1.5">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={`https://github.com/${user.preferred_username}.png?size=256`}
                    alt=""
                  />
                  <span className="flex items-center">
                    <span
                      className="ml-4 text-sm font-semibold leading-6 text-gray-900"
                      aria-hidden="true"
                    >
                      {user.name}
                    </span>
                    <ChevronDownIcon
                      className="ml-2 h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                    {userNavigation.map((item) => (
                      <Menu.Item key={item.name}>
                        {({ active }) => (
                          <Link
                            to={item.href}
                            className={classNames(
                              active ? "bg-gray-50" : "",
                              "block px-3 py-1 text-sm leading-6 text-gray-900",
                            )}
                          >
                            {item.name}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
