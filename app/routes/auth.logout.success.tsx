import { Link } from "@remix-run/react";

export default function LogoutSuccess() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Logout successful
        </h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        <p className="mt-10 text-center text-sm text-gray-500">
          <Link
            to="/"
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
